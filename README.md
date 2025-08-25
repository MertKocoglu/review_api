# Mobile App Review Scraper API

A comprehensive TypeScript/Express-based REST API for scraping app reviews from both Google Play Store and iOS App Store. Built for large-scale data collection with unlimited review fetching capabilities.

<img width="1460" height="788" alt="Ekran Resmi 2025-08-25 15 21 00" src="https://github.com/user-attachments/assets/b1e865c8-922d-4c13-b2a7-5e7ac532debd" />

## 🌟 Features

- 🎯 **Multi-Platform Support**: Extract reviews from both Google Play Store and iOS App Store
- 📊 **Unlimited Data Collection**: No artificial limits on review count (up to platform availability)
- 📁 **CSV Export**: Export reviews to CSV format with custom field separation
- 🚫 **Emoji Filtering**: Automatic emoji removal for clean data analysis
- 🌐 **Multi-Language Support**: Support for different languages and countries
- 📄 **Batch Processing**: Efficient pagination for large datasets
- 🔒 **Security**: Built-in security with Helmet, CORS, and proper error handling
- 🎨 **Web Interface**: User-friendly web UI for easy interaction

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- TypeScript

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/review-scraper-api.git
cd review-scraper-api

# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start

# For development with auto-reload
npm run dev
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Base URL: `http://localhost:3000`

### 🔍 Google Play Store Endpoints

#### Get Reviews
```http
GET /api/reviews/:appId
```

**Parameters:**
- `appId` (required): Google Play Store app ID (e.g., `com.whatsapp`)
- `lang` (optional): Language code (default: 'tr')
- `country` (optional): Country code (default: 'tr')
- `sort` (optional): Sort order - 'newest', 'rating', 'helpfulness' (default: 'newest')
- `num` (optional): Number of reviews to fetch (default: 100, no upper limit)

**Example:**
```bash
curl "http://localhost:3000/api/reviews/com.whatsapp?sort=newest&num=500000&lang=en"
```

#### Export Reviews to CSV
```http
POST /api/reviews/export/csv
```

**Request Body:**
```json
{
  "appId": "com.whatsapp",
  "num": 100000,
  "sort": "newest",
  "lang": "en",
  "country": "us"
}
```

#### Get App Information
```http
GET /api/reviews/:appId/info
```

#### Search Apps
```http
GET /api/reviews/search?q=instagram&num=50
```

### 🍎 iOS App Store Endpoints

#### Get Reviews
```http
GET /api/reviews/appstore/:appId
```

**Parameters:**
- `appId` (required): App Store app ID (numeric ID)
- `country` (optional): Country code (default: 'tr')
- `sort` (optional): Sort order - 'mostRecent', 'mostHelpful' (default: 'mostRecent')
- `num` (optional): Number of reviews to fetch (no upper limit)

**Example:**
```bash
curl "http://localhost:3000/api/reviews/appstore/310633997?num=50000&country=us"
```

#### Export App Store Reviews to CSV
```http
POST /api/reviews/appstore/export/csv
```

#### Search App Store Apps
```http
GET /api/reviews/appstore/search?q=instagram&num=50
```

### 🏥 Health Check
```http
GET /health
```

## 📋 CSV Export Features

### Field Structure

**Google Play CSV Format:**
```
id;;userName;;content;;score;;date;;thumbsUp;;version
```

**App Store CSV Format:**
```
id;;userName;;title;;content;;score;;version;;date
```

### Data Cleaning Features

- **Emoji Removal**: All emojis and unicode symbols are automatically filtered out
- **Field Separation**: Uses double semicolon (`;;`) as separator to avoid conflicts
- **Null Handling**: 
  - `null`/`undefined` values → `Null`
  - Empty strings/whitespace → `Nan`  
  - Emoji-only content → Empty field

## 🖥️ Web Interface

Navigate to `http://localhost:3000` to access the web interface featuring:

- **Platform Selection**: Choose between Google Play Store and App Store
- **Custom Review Count**: Input any number up to 1,000,000 reviews
- **Real-time Progress**: Monitor scraping progress
- **Direct CSV Download**: Download results immediately after processing

## 📊 Usage Examples

### JavaScript/Node.js

```javascript
// Fetch WhatsApp reviews
const response = await fetch('http://localhost:3000/api/reviews/com.whatsapp?num=10000&sort=newest');
const data = await response.json();

// Export to CSV
const csvResponse = await fetch('http://localhost:3000/api/reviews/export/csv', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    appId: 'com.whatsapp',
    num: 50000,
    sort: 'newest'
  })
});
```

### Python

```python
import requests
import json

# Get reviews
response = requests.get('http://localhost:3000/api/reviews/com.instagram.android?num=100000')
reviews = response.json()

# Export to CSV
csv_response = requests.post('http://localhost:3000/api/reviews/export/csv', 
    json={
        'appId': 'com.instagram.android',
        'num': 100000,
        'sort': 'newest'
    }
)
```

### cURL

```bash
# Get 500,000 TikTok reviews
curl "http://localhost:3000/api/reviews/com.zhiliaoapp.musically?num=500000&sort=newest"

# Export Instagram reviews to CSV
curl -X POST "http://localhost:3000/api/reviews/export/csv" \
  -H "Content-Type: application/json" \
  -d '{"appId":"com.instagram.android","num":200000,"sort":"newest"}'
```

## ⚡ Performance

- **Batch Processing**: Processes reviews in batches of 200 for optimal performance
- **Large Datasets**: Successfully tested with 500,000+ reviews
- **Memory Efficient**: Streams data processing to handle large exports
- **Rate Limiting**: Built-in delays to respect API limits

### Benchmark Results

| Platform | Review Count | Processing Time | File Size |
|----------|-------------|----------------|-----------|
| Google Play | 100,000 | ~3 minutes | ~15 MB |
| App Store | 50,000 | ~2 minutes | ~8 MB |
| Google Play | 500,000 | ~15 minutes | ~75 MB |

## 🛠️ Development

### Project Structure

```
├── src/
│   ├── app.ts                 # Main application
│   ├── routes/
│   │   └── reviews.ts         # API routes
│   ├── services/
│   │   ├── reviewService.ts   # Google Play service
│   │   ├── appStoreService.ts # App Store service
│   │   └── csvService.ts      # CSV export service
│   └── types/
│       └── app-store-scraper.d.ts
├── public/
│   └── index.html            # Web interface
└── exports/                  # CSV output directory
```

### Scripts

```bash
# Development with auto-reload
npm run dev

# Build TypeScript
npm run build

# Production start
npm start

# Clean build directory
npm run clean
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file for production:

```env
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
```

### Customization

The API supports various customization options:

- **Batch Size**: Modify batch processing size in `reviewService.ts`
- **Rate Limiting**: Adjust delays between requests
- **CSV Format**: Customize field separation and data cleaning rules
- **Export Location**: Change default export directory

## 📦 Dependencies

### Core Dependencies
- **Express.js**: Web framework
- **TypeScript**: Type-safe JavaScript
- **google-play-scraper**: Google Play Store scraping
- **app-store-scraper**: iOS App Store scraping
- **CORS**: Cross-origin resource sharing
- **Helmet**: Security middleware
- **Morgan**: HTTP request logging

### Development Dependencies
- **@types/**: TypeScript definitions
- **nodemon**: Development auto-reload
- **ts-node**: TypeScript execution

## 🚨 Important Notes

### Legal & Ethical Considerations
- This tool is for educational and research purposes
- Respect the terms of service of Google Play Store and App Store
- Implement appropriate rate limiting for production use
- Consider data privacy regulations when handling user reviews

### Limitations
- Review availability depends on platform policies
- Large datasets may take significant processing time
- Network stability affects large batch operations

### Best Practices
- Use reasonable delays between requests
- Monitor memory usage for very large datasets
- Implement proper error handling in production
- Consider using a queue system for multiple requests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [google-play-scraper](https://github.com/facundoolano/google-play-scraper) for Google Play Store integration
- [app-store-scraper](https://github.com/facundoolano/app-store-scraper) for iOS App Store integration
- Express.js community for the robust web framework

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/review-scraper-api/issues) page
2. Create a new issue with detailed information
3. Provide example requests and expected vs actual behavior

---

**⭐ Star this repository if you find it useful!**
