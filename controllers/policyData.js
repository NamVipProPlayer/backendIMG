// Create a file for your store policies
const storePolicies = {
  returnPolicy: {
    days: 30,
    conditions: [
      "Item must be in original condition",
      "All tags and packaging must be intact",
      "Receipt or proof of purchase required",
    ],
    exceptions: [
      "Undergarments cannot be returned for hygiene reasons",
      "Sale items marked as 'final sale' cannot be returned",
    ],
  },
  shipping: {
    localCity: {
      time: "3 days",
      cost: "Free for orders above $50",
    },
    outsideCity: {
      time: "2 weeks",
      cost: "$10 flat rate",
    },
    international: {
      time: "1 month",
      cost: "Calculated based on weight and destination",
    },
  },
  warranty: {
    standard: "90 days manufacturer warranty",
    extended: "1 year extended warranty available for purchase",
  },
};

module.exports = storePolicies;
