"""
MedSense — Fine-tune a transformer for symptom-text -> condition classification.

Usage:
    python train.py --data ./data/Symptom2Disease.csv --model distilbert-base-uncased --epochs 5

Expects a CSV with at least two columns:
    text  -> free-text symptom description
    label -> disease/condition name

Outputs:
    ./checkpoints/best_model/   (HF model + tokenizer, loaded by app.py)
    ./checkpoints/label_map.json
    ./checkpoints/metrics.json  (accuracy, macro-F1, confusion matrix)
"""

import argparse
import json
import os

import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, f1_score, confusion_matrix
from sklearn.model_selection import train_test_split
import torch

class SymptomDataset(torch.utils.data.Dataset):
    def __init__(self, encodings, labels):
        self.encodings = encodings
        self.labels = labels

    def __getitem__(self, idx):
        item = {key: torch.tensor(val[idx]) for key, val in self.encodings.items()}
        item['labels'] = torch.tensor(self.labels[idx], dtype=torch.long)
        return item

    def __len__(self):
        return len(self.labels)

from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
    DataCollatorWithPadding,
    EarlyStoppingCallback,
)


def load_and_split(csv_path: str, text_col: str, label_col: str, seed: int = 42):
    df = pd.read_csv(csv_path)
    df = df[[text_col, label_col]].dropna().drop_duplicates()
    df.columns = ["text", "label"]

    labels = sorted(df["label"].unique().tolist())
    label2id = {l: i for i, l in enumerate(labels)}
    id2label = {i: l for l, i in label2id.items()}
    df["label_id"] = df["label"].map(label2id)

    # 70/15/15 split, handle potential stratify error if classes are too small
    try:
        train_df, temp_df = train_test_split(
            df, test_size=0.30, random_state=seed, stratify=df["label_id"]
        )
        val_df, test_df = train_test_split(
            temp_df, test_size=0.50, random_state=seed, stratify=temp_df["label_id"]
        )
    except ValueError:
        print("Warning: Stratified split failed (likely too few samples per class). Falling back to random split.")
        train_df, temp_df = train_test_split(
            df, test_size=0.30, random_state=seed
        )
        val_df, test_df = train_test_split(
            temp_df, test_size=0.50, random_state=seed
        )
        
    return train_df, val_df, test_df, label2id, id2label


def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    return {
        "accuracy": accuracy_score(labels, preds),
        "macro_f1": f1_score(labels, preds, average="macro"),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True, help="Path to Symptom2Disease CSV")
    parser.add_argument("--text_col", default="text")
    parser.add_argument("--label_col", default="label")
    parser.add_argument(
        "--model",
        default="emilyalsentzer/Bio_ClinicalBERT",
        help="e.g. distilbert-base-uncased or emilyalsentzer/Bio_ClinicalBERT",
    )
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch_size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=2e-5)
    parser.add_argument("--out_dir", default="./checkpoints")
    args = parser.parse_args()

    os.makedirs(args.out_dir, exist_ok=True)

    train_df, val_df, test_df, label2id, id2label = load_and_split(
        args.data, args.text_col, args.label_col
    )
    num_labels = len(label2id)
    print(f"Loaded {len(train_df)} train / {len(val_df)} val / {len(test_df)} test "
          f"examples across {num_labels} conditions.")

    tokenizer = AutoTokenizer.from_pretrained(args.model)

    # Tokenize datasets using custom PyTorch dataset
    train_encodings = tokenizer(train_df["text"].tolist(), truncation=True, padding=False, max_length=128)
    val_encodings = tokenizer(val_df["text"].tolist(), truncation=True, padding=False, max_length=128)
    test_encodings = tokenizer(test_df["text"].tolist(), truncation=True, padding=False, max_length=128)

    train_ds = SymptomDataset(train_encodings, train_df["label_id"].tolist())
    val_ds = SymptomDataset(val_encodings, val_df["label_id"].tolist())
    test_ds = SymptomDataset(test_encodings, test_df["label_id"].tolist())

    model = AutoModelForSequenceClassification.from_pretrained(
        args.model, num_labels=num_labels, id2label=id2label, label2id=label2id
    )

    data_collator = DataCollatorWithPadding(tokenizer=tokenizer)

    training_args = TrainingArguments(
        output_dir=os.path.join(args.out_dir, "runs"),
        eval_strategy="epoch",
        save_strategy="epoch",
        learning_rate=args.lr,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        num_train_epochs=args.epochs,
        weight_decay=0.01,
        lr_scheduler_type="cosine",
        load_best_model_at_end=True,
        metric_for_best_model="macro_f1",
        logging_steps=20,
        report_to="none",
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_ds,
        eval_dataset=val_ds,
        processing_class=tokenizer,
        data_collator=data_collator,
        compute_metrics=compute_metrics,
        callbacks=[EarlyStoppingCallback(early_stopping_patience=2)],
    )

    trainer.train()

    # Final held-out test evaluation
    test_pred = trainer.predict(test_ds)
    preds = np.argmax(test_pred.predictions, axis=-1)
    test_labels = test_pred.label_ids

    metrics = {
        "test_accuracy": accuracy_score(test_labels, preds),
        "test_macro_f1": f1_score(test_labels, preds, average="macro"),
        "confusion_matrix": confusion_matrix(test_labels, preds).tolist(),
        "labels_order": [id2label[i] for i in range(num_labels)],
    }
    print("Test metrics:", {k: v for k, v in metrics.items() if k != "confusion_matrix"})

    best_model_dir = os.path.join(args.out_dir, "best_model")
    trainer.save_model(best_model_dir)
    tokenizer.save_pretrained(best_model_dir)

    with open(os.path.join(args.out_dir, "label_map.json"), "w") as f:
        json.dump({"label2id": label2id, "id2label": id2label}, f, indent=2)

    with open(os.path.join(args.out_dir, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"Saved best model to {best_model_dir}")


if __name__ == "__main__":
    main()
