const ShoesProduct = require("../models/ShoesProduct");

// Get all shoes
const getAllShoes = async (req, res) => {
  try {
    const shoes = await ShoesProduct.find();
    res.status(200).json(shoes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single shoe by ID
const getShoeById = async (req, res) => {
  try {
    const shoe = await ShoesProduct.findById(req.params.shoeId);
    if (!shoe) {
      return res.status(404).json({ message: "Shoe not found" });
    }
    res.status(200).json(shoe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new shoe product
const createShoe = async (req, res) => {
  const {
    fSrc,
    sSrc,
    name,
    brand,
    category,
    description,
    price,
    stock,
    sizes,
    colors,
  } = req.body;

  if (
    !fSrc ||
    !sSrc ||
    !name ||
    !brand ||
    !category ||
    !description ||
    price == null ||
    stock == null
  ) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  if (price < 0 || stock < 0) {
    return res
      .status(400)
      .json({ message: "Price and stock cannot be negative" });
  }

  const newShoe = new ShoesProduct({
    fSrc,
    sSrc,
    name,
    brand,
    category,
    description,
    price,
    stock,
    sizes,
    colors,
  });

  try {
    const savedShoe = await newShoe.save();
    res.status(201).json(savedShoe);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a shoe product by ID
const updateShoe = async (req, res) => {
  const {
    fSrc,
    sSrc,
    name,
    brand,
    category,
    description,
    price,
    stock,
    sizes,
    colors,
  } = req.body;

  if (price != null && price < 0) {
    return res.status(400).json({ message: "Price cannot be negative" });
  }

  if (stock != null && stock < 0) {
    return res.status(400).json({ message: "Stock cannot be negative" });
  }

  try {
    const updatedShoe = await ShoesProduct.findByIdAndUpdate(
      req.params.shoeId,
      {
        fSrc,
        sSrc,
        name,
        brand,
        category,
        description,
        price,
        stock,
        sizes,
        colors,
      },
      { new: true, runValidators: true }
    );
    if (!updatedShoe) {
      return res.status(404).json({ message: "Shoe not found" });
    }
    res.status(200).json(updatedShoe);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a shoe product by ID
const deleteShoe = async (req, res) => {
  try {
    const deletedShoe = await ShoesProduct.findByIdAndDelete(req.params.shoeId);
    if (!deletedShoe) {
      return res.status(404).json({ message: "Shoe not found" });
    }
    res.status(200).json({ message: "Shoe deleted successfully" });
  } catch (error) {
    console.error("Error deleting shoe:", error);
    res.status(500).json({ message: error.message });
  }
};
// Search shoes by various criteria (for chatbot integration)
const searchShoes = async (req, res) => {
  try {
    const {
      name,
      query,  // Added natural language query parameter
      category,
      brand,
      color,
      minPrice,
      maxPrice,
      size,
      inStock,
      sortBy,
      limit = 20
    } = req.query;

    // Build the search query
    const searchQuery = {};

    // Process natural language query if provided
    if (query) {
      const extractedTerms = extractSearchTerms(query);
      Object.assign(searchQuery, extractedTerms);
    } else {
      // Existing parameter handling
      if (name) {
        searchQuery.name = { $regex: name, $options: 'i' };
      }
      
      if (category) {
        if (Array.isArray(category)) {
          searchQuery.category = { $in: category };
        } else {
          searchQuery.category = category;
        }
      }
      
      if (brand) {
        searchQuery.brand = { $regex: brand, $options: 'i' };
      }
      
      if (color) {
        searchQuery.colors = { $regex: color, $options: 'i' };
      }
    }

    // Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      searchQuery.price = {};
      if (minPrice !== undefined) searchQuery.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) searchQuery.price.$lte = Number(maxPrice);
    }

    // Size filter
    if (size) {
      searchQuery.sizes = size;
    }

    // Stock availability
    if (inStock === 'true') {
      searchQuery.stock = { $gt: 0 };
    }

    // Build the sort options
    let sortOptions = {};
    if (sortBy) {
      switch (sortBy) {
        case 'price_asc':
          sortOptions.price = 1;
          break;
        case 'price_desc':
          sortOptions.price = -1;
          break;
        case 'newest':
          sortOptions.createdAt = -1;
          break;
        case 'name_asc':
          sortOptions.name = 1;
          break;
        default:
          sortOptions.name = 1;
      }
    }

    console.log("Final search query:", searchQuery);

    // Execute the query with pagination
    const shoes = await ShoesProduct.find(searchQuery)
      .sort(sortOptions)
      .limit(Number(limit));

    // Get the total count for pagination
    const total = await ShoesProduct.countDocuments(searchQuery);

    res.status(200).json({
      total,
      count: shoes.length,
      data: shoes,
    });
  } catch (error) {
    console.error("Error searching shoes:", error);
    res.status(500).json({ message: error.message });
  }
};

// Extract search terms from natural language query
function extractSearchTerms(queryText) {
  const searchTerms = {};
  
  // Convert to lowercase for case-insensitive matching
  const text = queryText.toLowerCase();
  
  // Define patterns to recognize
  const colorPatterns = [
    'black', 'white', 'red', 'blue', 'green', 'yellow', 'brown', 'gray', 
    'grey', 'purple', 'pink', 'orange', 'silver', 'gold', 'navy', 'beige'
  ];
  
  const brandPatterns = [
    'nike', 'adidas', 'jordan', 'converse', 'puma', 'reebok', 'new balance', 
    'asics', 'vans', 'skechers', 'under armour', 'fila'
  ];
  
  const categoryPatterns = [
    "men's shoes",
    "women's shoes",
    "running",
    "basketball",
    "casual",
    "formal",
    "boots",
    "sandals",
    "sneakers",
    "athletic",
    "walking",
    "training",
    "hiking",
    "tennis",
  ];
  
  // Extract colors
  for (const color of colorPatterns) {
    if (text.includes(color)) {
      searchTerms.colors = { $regex: color, $options: 'i' };
      break;
    }
  }
  
  // Extract brands
  for (const brand of brandPatterns) {
    if (text.includes(brand)) {
      searchTerms.brand = { $regex: brand, $options: 'i' };
      break;
    }
  }
  
  // Extract categories
  for (const category of categoryPatterns) {
    if (text.includes(category)) {
      searchTerms.category = { $regex: category, $options: 'i' };
      break;
    }
  }
  
  // Check for size mentions (common US sizes 5-15)
  const sizeRegex = /\bsize\s+(\d+\.?\d*)\b|\bsize:\s*(\d+\.?\d*)\b/i;
  const sizeMatch = text.match(sizeRegex);
  if (sizeMatch) {
    const size = sizeMatch[1] || sizeMatch[2];
    searchTerms.sizes = Number(size);
  }
  
  // Check for price mentions
  if (text.includes('under') || text.includes('less than')) {
    const priceRegex = /\$(\d+)/;
    const priceMatch = text.match(priceRegex);
    if (priceMatch && priceMatch[1]) {
      searchTerms.price = { $lte: Number(priceMatch[1]) };
    }
  }
  
  // If no specific attributes were found, use the query as a general text search
  if (Object.keys(searchTerms).length === 0) {
    // Create a broader search that looks for matches in multiple fields
    searchTerms.$or = [
      { name: { $regex: queryText, $options: 'i' } },
      { description: { $regex: queryText, $options: 'i' } },
      { brand: { $regex: queryText, $options: 'i' } },
      { category: { $regex: queryText, $options: 'i' } }
    ];
  }
  
  return searchTerms;
}

// Get shoe suggestions for chatbot based on user input
const getSuggestions = async (req, res) => {
  try {
    const { query, limit = 5 } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: "Query parameter is required" });
    }
    
    // First try to extract structured search terms
    const extractedTerms = extractSearchTerms(query);
    
    // Create a MongoDB query from the extracted terms
    const searchQuery = {};
    
    // If we extracted specific attributes, use those
    if (extractedTerms.$or) {
      // Use the $or query directly
      searchQuery.$or = extractedTerms.$or;
    } else {
      // Build an $or query from the specific attributes
      searchQuery.$or = [];
      
      // Add each extracted term to the $or query
      Object.entries(extractedTerms).forEach(([key, value]) => {
        if (key === 'colors') {
          searchQuery.$or.push({ colors: value });
        } else if (key === 'sizes') {
          searchQuery.$or.push({ sizes: value });
        } else {
          searchQuery.$or.push({ [key]: value });
        }
      });
      
      // Also add a general text search
      searchQuery.$or.push({ name: { $regex: query, $options: 'i' } });
      searchQuery.$or.push({ description: { $regex: query, $options: 'i' } });
    }
    
    const suggestions = await ShoesProduct.find(searchQuery)
      .select('name brand category price colors')
      .limit(Number(limit));
    
    res.status(200).json(suggestions);
  } catch (error) {
    console.error("Error getting shoe suggestions:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllShoes,
  getShoeById,
  createShoe,
  updateShoe,
  deleteShoe,
  searchShoes,
  getSuggestions,
};
