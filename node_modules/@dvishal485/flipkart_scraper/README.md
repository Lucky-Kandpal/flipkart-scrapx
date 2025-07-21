# flipkart-scraper

[![Crates.io](https://img.shields.io/crates/v/flipkart-scraper)](https://crates.io/crates/flipkart-scraper/)
[![NPM Version](https://img.shields.io/npm/v/%40dvishal485%2Fflipkart_scraper?color=green)](https://www.npmjs.com/package/@dvishal485/flipkart_scraper)
[![Documentation](https://img.shields.io/badge/API-Documentation-blue)](https://docs.rs/flipkart_scraper/latest/flipkart_scraper/)
[![GitHub issues](https://img.shields.io/github/issues/dvishal485/flipkart-scraper)](https://github.com/dvishal485/flipkart-scraper/issues)
[![Telegram](https://img.shields.io/badge/-dvishal485-blue?style=flat&logo=telegram)](https://t.me/dvishal485)
[![GitHub license](https://img.shields.io/github/license/dvishal485/flipkart-scraper)](https://github.com/dvishal485/flipkart-scraper/blob/main/LICENSE)

Scrapes product details and searches on Flipkart.

**Disclaimer:** I am not affiliated or linked to flipkart in any way. This repository is an exploratory project and not meant for commercial use.

---

## Features

- Does not require any client id/secret or any other authorisation

- Fetch product details from URL of product which includes

  - Product Name
  - Current and Original Price
  - User Rating
  - Stock avalibility
  - Flipkart Assured Product
  - Share URL (More presentable URL)
  - Seller Information (Seller Name and Rating)
  - Product Thumbnails
  - Highlights
  - Available Offers
  - Product Specifications

- Search product on Flipkart from its query, giving the following details

  - Product Name
  - Product Link
  - Product Thumbnail
  - Current Price of Product
  - Original Price of Product

---

## Example Usage

Navigate to [examples](https://github.com/dvishal485/flipkart-scraper/tree/main/examples) for basic use cases.

### NPM Package

NPM Package can be used to parse the contents of webpage to return a valid JSON object response.

Refer to [examples/js_demo example](https://github.com/dvishal485/flipkart-scraper/tree/main/examples/js_demo) for a quick overview of using the npm package.

The package can be installed with npm

```bash
npm i @dvishal485/flipkart_scraper
```

- Fetching Product Details

   1. Fetch the product page using fetch API or axios or any other networking module.
   2. Parse the webpage content using the library.

      ```javascript
      import flipkart_scraper from "@dvishal485/flipkart_scraper";

      const product_details = flipkart_scraper.parse_product_details(product_webpage);
      console.log(product_details);
      ```

- Searching Products

  1. Fetch the search page (`https://www.flipkart.com/search?q={query}`) using fetch API or axios or any other networking module.
  2. Parse the webpage content using the library.

    ```javascript
    import flipkart_scraper from "@dvishal485/flipkart_scraper";

    const search_result = flipkart_scraper.parse_search_results(product_webpage);
    console.log(search_result);
    ```

### Rust Crate

- Fetching Product Details

  Snippet to fetch and print product details from Flipkart using product's URL.

  ```rust
  use std::error::Error;
  use flipkart_scraper::{ProductDetails, Url};

  #[tokio::main]
  async fn main() -> Result<(), Box<dyn Error>> {
      let url = "https://www.flipkart.com/samsung-galaxy-f13-waterfall-blue-64-gb/p/itm583ef432b2b0c";
      let details = ProductDetails::fetch(Url::parse(url)?).await;
      println!("{:#?}", details);
      Ok(())
  }
  ```

- Searching Products

  Snippet to search a particular product on Flipkart using a given query.

  ```rust
  use flipkart_scraper::ProductSearch;
  use std::error::Error;

  #[tokio::main]
  async fn main() -> Result<(), Box<dyn Error>> {
      let query = "samsung washing machine";
      let details = ProductSearch::search(query.into()).await;
      if let Ok(s) = details {
          println!("{:#?}\n\nTotal {} search results.", s, s.results.len());
      } else {
          println!("{}", details.unwrap_err());
      }
      Ok(())
  }
  ```

---

## License

This Project is licensed under GNU General Public License (GPL-3.0).

---
