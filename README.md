# Stock Market Forecasting App

A sophisticated web application for stock market price prediction using multiple machine learning models.

![App Screenshot](https://img.freepik.com/free-vector/gradient-stock-market-concept_23-2149166910.jpg)

## Features

- **Real-time stock data** fetching from the Stooq API
- **Interactive data visualization** with Plotly
- **Time series analysis** including stationarity testing and seasonal decomposition
- **Multiple AI models** for stock price prediction:
  - XGBoost
  - LSTM (Long Short-Term Memory)
  - Prophet (Facebook's forecasting tool)
- **Performance metrics** including MAE, MSE, RMSE, and R²
- **Future price predictions** with visualization

## Tech Stack

- **Backend**: 
  - Flask (Python web framework)
  - Pandas & NumPy for data manipulation
  - Scikit-learn, Keras/TensorFlow, and XGBoost for ML models
  - Prophet for time series forecasting

- **Frontend**:
  - HTML5, CSS3, JavaScript
  - Bootstrap 5 for responsive design
  - Plotly.js for interactive charts
  - jQuery for DOM manipulation

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/stock-market-forecasting-app.git
cd stock-market-forecasting-app
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install the required dependencies:
```bash
pip install -r requirements.txt
```

4. Create necessary directories if they don't exist:
```bash
mkdir -p static/css static/js templates
```

## Usage

1. Start the Flask server:
```bash
python app.py
```

2. Open your web browser and navigate to:
```
http://localhost:5000
```

3. Select a stock, date range, and the AI model you want to use for prediction.

4. Click "Fetch Data" to analyze and forecast the stock price.

## Project Structure

```
stock-market-forecasting-app/
├── app.py                   # Flask backend and ML models
├── requirements.txt         # Python dependencies
├── README.md                # Project documentation
├── static/                  # Static files
│   ├── css/
│   │   └── style.css        # Custom CSS styles
│   └── js/
│       └── main.js          # Frontend JavaScript logic
└── templates/
    └── index.html           # Main HTML template
```

## Dependencies

The project requires the following major libraries:
- Flask
- pandas
- numpy
- matplotlib
- seaborn
- plotly
- statsmodels
- prophet
- scikit-learn
- tensorflow
- keras
- xgboost

A complete list is available in the `requirements.txt` file.

## Creating requirements.txt

```bash
pip freeze > requirements.txt
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Data provided by [Stooq](https://stooq.com/)
- Original Streamlit app converted to a Flask web application

## Future Improvements

- Add more stock markets and indices
- Implement backtesting functionality
- Allow users to upload their own data
- Add model parameter customization
- Integrate with additional data sources

## Adding the Background Video

To complete the enhanced UI with a background video, follow these steps:

1. Download a free stock market background video from one of these sources:
   - [Videezy - Stock Market And Exchange Background Loop](https://www.videezy.com/free-video/stock-market)
   - [Pexels - Stock Market Videos](https://www.pexels.com/search/videos/stock%20market/)
   - [Pixabay - Stock Market Videos](https://pixabay.com/videos/search/stock%20market/)

2. Rename the downloaded video to `stock_market_bg.mp4`

3. Place the video in the `static/videos/` directory of the project

4. If you cannot find a suitable video, you can use a static background image instead by modifying the CSS:

```css
.hero-section {
    background-image: url('/static/images/stock-market-bg.jpg'); /* Add your background image */
    background-size: cover;
    background-position: center;
    position: relative;
    padding: 120px 0;
    color: white;
    overflow: hidden;
}

/* Hide video background elements */
.video-background, .video-overlay {
    display: none;
}
```

For optimal performance, consider the following:
- Use a compressed video with a size less than 10MB
- Consider adding a `preload="auto"` attribute to the video tag for faster loading
- If the video affects performance, use a static image instead 