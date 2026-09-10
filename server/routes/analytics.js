import { Router } from "express";
import Query from "../models/Query.js";

const router = Router();

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "for", "on", "with",
  "is", "are", "my", "i", "me", "have", "has", "been", "it", "this", "that",
]);

// GET /api/analytics/top-conditions
router.get("/top-conditions", async (_req, res, next) => {
  try {
    const results = await Query.aggregate([
      { $group: { _id: "$top_condition", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    const total = results.reduce((sum, r) => sum + r.count, 0) || 1;

    res.json({
      totalQueries: total,
      conditions: results.map((r) => ({
        condition: r._id,
        count: r.count,
        percentage: Number(((r.count / total) * 100).toFixed(1)),
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/symptom-keywords
router.get("/symptom-keywords", async (_req, res, next) => {
  try {
    const docs = await Query.find({}, { symptom_text: 1 }).limit(5000).lean();
    const freq = new Map();

    for (const doc of docs) {
      const tokens = doc.symptom_text.toLowerCase().match(/[a-z]+/g) || [];
      for (const token of tokens) {
        if (token.length <= 2 || STOPWORDS.has(token)) continue;
        freq.set(token, (freq.get(token) || 0) + 1);
      }
    }

    const topKeywords = [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([keyword, count]) => ({ keyword, count }));

    res.json({ keywords: topKeywords });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/query-volume?granularity=daily|weekly
router.get("/query-volume", async (req, res, next) => {
  try {
    const granularity = req.query.granularity === "weekly" ? "weekly" : "daily";
    const dateFormat = granularity === "weekly" ? "%G-W%V" : "%Y-%m-%d";

    const results = await Query.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      granularity,
      buckets: results.map((r) => ({ period: r._id, count: r.count })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
