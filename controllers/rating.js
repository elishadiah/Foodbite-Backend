const User = require("../models/User");
const Food = require("../models/Food");
const Rating = require("../models/Rating");

exports.createRating = async (req, res, next) => {
  const { userId, ratorUserId, ratingValue, image, feedback } = req.body;
  if (!userId || !ratorUserId || !ratingValue || !feedback)
    return res.status(400).send("Please fill in all the required fields!");
  try {
    const ratingObj = {
      userId,
      ratorUserId,
      ratingValue,
      image,
      feedback,
    };
    const rating = await new Rating(ratingObj).save();
    return res.status(201).json({ rating: { ...rating._doc } });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

exports.getAllRatings = async (req, res, next) => {
  try {
    const rating = await Rating.find();
    if (!rating)
      return res.status(400).send("Ratings not found, Authorization denied..");
    return res.status(200).json(rating);
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

exports.getRatingsByUserId = async (req, res, next) => {
  const { userId } = req.params;
  console.log("FindById :: >>", userId);
  try {
    const rating = await Rating.find({ userId: userId });
    const donation = await Food.find({ createdById: userId });
    if (!rating)
      return res
        .status(400)
        .send("Food Donationas not found, Authorization denied..");
    let tempRes = 0;
    rating.map((item) => (tempRes += item.ratingValue));
    let ratingScore = tempRes / rating.length;
    return res.status(200).json({
      userId: userId,
      foodDonation: donation,
      ratingScore: ratingScore,
      totalRaters: rating.length,
      reviews: rating,
    });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

exports.getRecommendedUsersByRating = async (req, res, next) => {
  try {
    const users = await User.aggregate([
      {
        $lookup: {
          from: Rating.collection.name,
          localField: "_id",
          foreignField: "userId",
          as: "ratings",
        },
      },
      {
        $lookup: {
          from: Food.collection.name,
          localField: "_id",
          foreignField: "createdById",
          as: "foodDonation",
        },
      },
    ]);
    const result = users
      .map((user) => {
        const totalRators = user.ratings.length;
        const ratingScore =
          totalRators === 0
            ? -1
            : user.ratings.reduce((a, b) => a + b.ratingValue, 0) / totalRators;
        return {
          userId: user._id,
          providerName: user.name,
          ratingScore,
          totalRators,
          reviews: user.ratings,
          foodDonation: user.foodDonation,
        };
      })
      .sort((a, b) =>
        a.ratingScore > b.ratingScore
          ? -1
          : b.ratingScore > a.ratingScore
          ? 1
          : 0
      );
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

exports.getRatingsByRatorUserId = async (req, res, next) => {
  const { ratorId } = req.params;
  console.log("FindByUserId :: >>", ratorId);
  try {
    const rating = await Rating.find({ ratorUserId: ratorId });
    if (!rating)
      return res
        .status(400)
        .send("Food Donationas not found, Authorization denied..");
    return res.status(200).json(rating);
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

exports.updateRating = async (req, res, next) => {
  const { id } = req.params;
  console.log("Updating Rating ID:: >>", id);
  try {
    const rating = await Rating.findById(id).lean();
    if (!rating) return res.status(400).send("Rating does not exist");
    const ratingObj = { ...req.body };
    const newRating = await Rating.findByIdAndUpdate(
      { _id: id },
      { ...ratingObj },
      { new: true }
    );
    return res.status(200).json(newRating);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json(error);
  }
};

exports.deleteRating = async (req, res, next) => {
  const { id } = req.params;
  console.log("Rating ID::", id);
  try {
    await Rating.findByIdAndDelete({ _id: id });
    return res.status(200).send("Rating has been deleted");
  } catch (error) {
    return res.status(500).json(error);
  }
};
