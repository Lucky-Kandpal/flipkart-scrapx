import flipkart_scraper from "@dvishal485/flipkart_scraper";

import express from "express";
const port = process.env.PORT || 3001;

const app = express();
app.use(express.json());

// Logger queue for concurrent logging
const logQueue = [];
let isLogging = false;
let responseLogs = [];

// Browser headers to avoid detection
const browserHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0'
};

function logEndpoint(level, ...args) {
    logQueue.push({ level, args });
    responseLogs.push({ level, message: args.join(" ") });
    processLogs();
}

async function processLogs() {
    if (isLogging) return;
    isLogging = true;
    while (logQueue.length) {
        const { level, args } = logQueue.shift();
        console.log(`[${level.toUpperCase()}]`, ...args);
        await new Promise(resolve => setTimeout(resolve, 1));
    }
    isLogging = false;
}

async function* streamProducts(products, limit = 5) {
    for (let i = 0; i < Math.min(products.length, limit); i++) {
        const product = products[i];
        logEndpoint("info", `\nFetching details for product ${i + 1}: ${product.product_name}`);
        try {
            // Add delay and headers for individual product requests
            await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500)); // 0.5-1.5s delay
            
            const product_webpage = await fetch(product.product_link, {
                headers: browserHeaders
            }).then(r => r.text());
            
            const details = flipkart_scraper.parse_product_details(product_webpage);
            const combinedData = {
                product_name: product.product_name,
                product_link: product.product_link,
                thumbnail: product.thumbnail,
                current_price: product.current_price,
                original_price: product.original_price,
                highlights: details.highlights || [],
                product_id: details.product_id || null,
                in_stock: details.in_stock || false,
                rating: details.rating || null
            };
            logEndpoint("info", "\n" + "=".repeat(50));
            logEndpoint("info", `📱 Product ${i + 1}:`);
            logEndpoint("info", `Name: ${combinedData.product_name}`);
            logEndpoint("info", `Price: ₹${combinedData.current_price} (was ₹${combinedData.original_price})`);
            logEndpoint("info", `Rating: ${combinedData.rating ? `${combinedData.rating}/5 ⭐` : 'Not available'}`);
            logEndpoint("info", `In Stock: ${combinedData.in_stock ? '✅ Yes' : '❌ No'}`);
            logEndpoint("info", `Product ID: ${combinedData.product_id || 'Not available'}`);
            logEndpoint("info", `Highlights: ${combinedData.highlights.length > 0 ? combinedData.highlights.join(', ') : 'None'}`);
            logEndpoint("info", `Link: ${combinedData.product_link}`);
            yield combinedData;
        } catch (error) {
            logEndpoint("error", `❌ Error fetching details for ${product.product_name}:`, error.message);
            const fallbackData = {
                product_name: product.product_name,
                product_link: product.product_link,
                thumbnail: product.thumbnail,
                current_price: product.current_price,
                original_price: product.original_price,
                highlights: [],
                product_id: null,
                in_stock: null,
                rating: null
            };
            logEndpoint("info", "\n" + "=".repeat(50));
            logEndpoint("info", `📱 Product ${i + 1}:`);
            logEndpoint("info", `Name: ${fallbackData.product_name}`);
            logEndpoint("info", `Price: ₹${fallbackData.current_price} (was ₹${fallbackData.original_price})`);
            logEndpoint("info", `Rating: Not available`);
            logEndpoint("info", `In Stock: Not available`);
            logEndpoint("info", `Product ID: Not available`);
            logEndpoint("info", `Highlights: None`);
            logEndpoint("info", `Link: ${fallbackData.product_link}`);
            yield fallbackData;
        }
        // Increased delay between products
        await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200)); // 0.2-0.7s delay
    }
}

// Express endpoint
app.post("/scrape", async (req, res) => {
    responseLogs = [];
    const { url, limit } = req.body;
    if (!url) {
        return res.status(400).json({ error: "Missing 'url' in request body" });
    }
    // Parse and validate limit
    let parsedLimit = 5;
    if (limit !== undefined) {
        parsedLimit = parseInt(limit, 10);
        if (isNaN(parsedLimit) || parsedLimit < 1) {
            return res.status(400).json({ error: "'limit' must be a positive integer" });
        }
    }
    try {
        logEndpoint("info", `Scraping URL: ${url}`);
        
        // Add headers and debug response
        const response = await fetch(url, {
            headers: browserHeaders
        });
        
        logEndpoint("info", `Response status: ${response.status}`);
        logEndpoint("info", `Response content-type: ${response.headers.get('content-type')}`);
        
        const webpage = await response.text();
        logEndpoint("info", `Response length: ${webpage.length} characters`);
        
        // Debug: log first 200 characters to see what we're getting
        logEndpoint("info", `Response preview: ${webpage.substring(0, 200).replace(/\s+/g, ' ')}`);
        
        const data = flipkart_scraper.parse_search_results(webpage);

        logEndpoint("info", `Found ${data.length} products. Streaming detailed information...`);
        const detailedProducts = [];
        for await (const productData of streamProducts(data, parsedLimit)) {
            detailedProducts.push(productData);
        }
        logEndpoint("info", "Scraping complete.");
        return res.json({
            products: detailedProducts,
            logs: responseLogs
        });
    } catch (error) {
        logEndpoint("error", "Scraping failed:", error.message);
        return res.status(500).json({
            error: error.message,
            logs: responseLogs
        });
    }
});

// Add a root endpoint for testing
app.get("/", (req, res) => {
    res.json({ 
        message: "Flipkart Scraper API", 
        endpoints: {
            "POST /scrape": "Scrape Flipkart search results"
        },
        status: "Running"
    });
});

// Start server - Fixed the port message
app.listen(port, () => {
    console.log(`Scraper API listening on port ${port}`);
});
