const Book = require("../models/book");
const User = require("../models/User");

// Get Personalized Recommendations
exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate("booksViewed.book");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 1. Extract viewed book IDs and categories
    const viewedBookIds = user.booksViewed.map((v) => v.book._id.toString());
    const categoryCounts = {};

    user.booksViewed.forEach((v) => {
      if (v.book && v.book.category) {
        const catId = v.book.category.toString();
        categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
      }
    });

    // 2. Sort categories by frequency
    const sortedCategories = Object.keys(categoryCounts).sort(
      (a, b) => categoryCounts[b] - categoryCounts[a]
    );

    let recommendations = [];

    // 3. Try to get books from the top 3 categories that the user hasn't viewed
    if (sortedCategories.length > 0) {
      recommendations = await Book.find({
        status: "approved",
        softDelete: false,
        category: { $in: sortedCategories.slice(0, 3) },
        _id: { $nin: viewedBookIds },
      })
        .limit(5)
        .populate("category", "name")
        .sort({ averageRating: -1, views: -1 });
    }

    // 4. Fill with trending books if fewer than 5 recommendations
    if (recommendations.length < 5) {
      const remainingCount = 5 - recommendations.length;
      const trendingBooks = await Book.find({
        status: "approved",
        softDelete: false,
        _id: { $nin: [...viewedBookIds, ...recommendations.map((r) => r._id)] },
      })
        .limit(remainingCount)
        .populate("category", "name")
        .sort({ views: -1, averageRating: -1 });

      recommendations = [...recommendations, ...trendingBooks];
    }

    // Add "reason" for each recommendation (simplified for now)
    const processedRecommendations = recommendations.map((book) => {
      let reason = "Popular in our community";
      if (sortedCategories.includes(book.category._id.toString())) {
        reason = `Based on your interest in ${book.category.name}`;
      } else if (book.averageRating > 4) {
        reason = "Highly rated by other readers";
      }
      return { 
        ...book.toObject(), 
        recommendationReason: reason 
      };
    });

    res.json(processedRecommendations);
  } catch (error) {
    console.error("Recommendation Error:", error);
    res.status(500).json({ message: "Failed to get recommendations" });
  }
};
