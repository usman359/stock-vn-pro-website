// Global variables for news section
let newsData = [];
let currentTicker = '';
let currentPage = 1;
let totalArticles = 0;
let articlesPerPage = 6;
let realTimeUpdateInterval;
let sentimentChart;
let realTimeChart;
let isNewsLoading = false; // Track if news is currently being fetched

// DOM elements
const newsTickerSelect = document.getElementById('news-ticker-select');
const customTickerInput = document.getElementById('custom-ticker');
const useCustomTickerBtn = document.getElementById('use-custom-ticker');
const fetchNewsBtn = document.getElementById('fetch-news-btn');
const newsDateRange = document.getElementById('news-date-range');
const newsCategory = document.getElementById('news-category');
const newsSort = document.getElementById('news-sort');
const loadMoreNewsBtn = document.getElementById('load-more-news');
const tryDifferentFiltersBtn = document.getElementById('try-different-filters');

// Initialize news section
document.addEventListener('DOMContentLoaded', function() {
    // Setup event listeners
    if (newsTickerSelect) newsTickerSelect.addEventListener('change', updateTickerSelection);
    if (useCustomTickerBtn) useCustomTickerBtn.addEventListener('click', applyCustomTicker);
    if (customTickerInput) {
        customTickerInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                applyCustomTicker();
            }
        });
    }
    if (fetchNewsBtn) fetchNewsBtn.addEventListener('click', fetchNewsArticles);
    if (newsSort) newsSort.addEventListener('change', sortNewsArticles);
    if (loadMoreNewsBtn) loadMoreNewsBtn.addEventListener('click', loadMoreNews);
    if (tryDifferentFiltersBtn) tryDifferentFiltersBtn.addEventListener('click', showFilters);

    // Initialize charts
    initializeSentimentChart();
    initializeRealTimeChart();

    // Add navigation event listener for news section
    const newsNavLink = document.getElementById('nav-news');
    if (newsNavLink) {
        newsNavLink.addEventListener('click', function() {
            // Pre-select ticker if we already have a company selected in the forecast section
            if (window.tickerSelect && window.tickerSelect.value) {
                if (newsTickerSelect) {
                    newsTickerSelect.value = window.tickerSelect.value;
                    updateTickerSelection();
                }
            }
        });
    }
});

// Initialize empty sentiment chart
function initializeSentimentChart() {
    const canvas = document.getElementById('sentiment-chart');
    if (!canvas) {
        console.error('Sentiment chart canvas element not found');
        return;
    }

    try {
        // Check if context can be obtained
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get 2D context for sentiment chart');
            return;
        }
        
        // Clear any existing chart
        if (sentimentChart) {
            sentimentChart.destroy();
        }
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        console.log('Initializing sentiment chart');
        sentimentChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Positive', 'Neutral', 'Negative'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: [
                        'rgba(40, 167, 69, 0.7)',
                        'rgba(108, 117, 125, 0.7)',
                        'rgba(220, 53, 69, 0.7)'
                    ],
                    borderColor: [
                        'rgba(40, 167, 69, 1)',
                        'rgba(108, 117, 125, 1)',
                        'rgba(220, 53, 69, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                return `${label}: ${percentage}% (${value} articles)`;
                            }
                        }
                    }
                },
                cutout: '70%'
            }
        });
        console.log('Sentiment chart initialized successfully');
    } catch (error) {
        console.error('Error initializing sentiment chart:', error);
        // Add fallback UI element to indicate chart error
        canvas.style.display = 'none';
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-warning text-center';
        errorDiv.innerHTML = 'Sentiment chart unavailable';
        canvas.parentNode.appendChild(errorDiv);
    }
}

// Initialize empty real-time chart
function initializeRealTimeChart() {
    const canvas = document.getElementById('real-time-chart');
    if (!canvas) {
        console.error('Real-time chart canvas element not found');
        return;
    }

    try {
        // Check if there's already a chart instance and destroy it
        if (realTimeChart) {
            realTimeChart.destroy();
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get 2D context for real-time chart');
            return;
        }

        console.log('Initializing real-time chart');
        
        // Clear any existing content on the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Create new chart
        realTimeChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Price',
                    data: [],
                    backgroundColor: 'rgba(77, 154, 255, 0.2)',
                    borderColor: 'rgba(77, 154, 255, 1)',
                    borderWidth: 2,
                    pointRadius: 3,
                    pointBackgroundColor: 'rgba(77, 154, 255, 1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `$${context.raw.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: 'rgba(200, 200, 200, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
        
        console.log('Real-time chart initialized successfully');
    } catch (error) {
        console.error('Error initializing real-time chart:', error);
        // Add fallback UI element
        if (canvas) {
            canvas.style.display = 'none';
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-warning text-center';
            errorDiv.innerHTML = 'Real-time chart unavailable';
            canvas.parentNode.appendChild(errorDiv);
        }
    }
}

// Update ticker selection
function updateTickerSelection() {
    if (!newsTickerSelect) return;
    
    currentTicker = newsTickerSelect.value;
    if (customTickerInput) customTickerInput.value = '';
    
    // Update UI to reflect selection
    const newsCompanyElement = document.getElementById('news-company');
    if (newsCompanyElement && newsTickerSelect.selectedIndex >= 0) {
        newsCompanyElement.textContent = newsTickerSelect.options[newsTickerSelect.selectedIndex].text;
    }
    
    // Show the ticker in the real-time updates
    const rtCompanyNameElement = document.getElementById('rt-company-name');
    const rtCompanyTickerElement = document.getElementById('rt-company-ticker');
    
    if (rtCompanyNameElement && newsTickerSelect.selectedIndex >= 0) {
        rtCompanyNameElement.textContent = newsTickerSelect.options[newsTickerSelect.selectedIndex].text;
    }
    
    if (rtCompanyTickerElement) {
        rtCompanyTickerElement.textContent = currentTicker;
    }
    
    // Make sure real-time-updates section is visible
    const realTimeUpdates = document.getElementById('real-time-updates');
    if (realTimeUpdates) {
        realTimeUpdates.style.display = 'block';
    }
    
    // Start real-time updates
    startRealTimeUpdates();
    
    // Automatically fetch news when ticker is selected
    fetchNewsArticles();
}

// Apply custom ticker
function applyCustomTicker() {
    if (!customTickerInput) return;
    
    if (!customTickerInput.value.trim()) {
        showNewsError('Please enter a valid ticker symbol');
        return;
    }
    
    currentTicker = customTickerInput.value.trim().toUpperCase();
    
    // Update UI to reflect custom ticker
    const newsCompanyElement = document.getElementById('news-company');
    const rtCompanyNameElement = document.getElementById('rt-company-name');
    const rtCompanyTickerElement = document.getElementById('rt-company-ticker');
    
    if (newsCompanyElement) {
        newsCompanyElement.textContent = currentTicker;
    }
    
    if (rtCompanyNameElement) {
        rtCompanyNameElement.textContent = currentTicker;
    }
    
    if (rtCompanyTickerElement) {
        rtCompanyTickerElement.textContent = currentTicker;
    }
    
    // Clear dropdown selection
    if (newsTickerSelect) {
        newsTickerSelect.selectedIndex = -1;
    }
    
    // Make sure real-time-updates section is visible
    const realTimeUpdates = document.getElementById('real-time-updates');
    if (realTimeUpdates) {
        realTimeUpdates.style.display = 'block';
    }
    
    console.log(`News section: Custom ticker selected - ${currentTicker}`);
    
    // Start real-time updates
    startRealTimeUpdates();
    
    // Fetch news for the custom ticker
    fetchNewsArticles();
}

// Fetch news articles
async function fetchNewsArticles() {
    if (isNewsLoading) {
        console.log("News fetch already in progress");
        return;
    }
    
    isNewsLoading = true;
    console.log('Fetching news articles');
    
    // Reset pagination
    currentPage = 1;
    
    // Get ticker
    const ticker = currentTicker || (newsTickerSelect ? newsTickerSelect.value : '');
    if (!ticker) {
        showNewsError('Please select a company or enter a custom ticker');
        isNewsLoading = false;
        return;
    }
    
    // Get date range and category
    const dateRange = newsDateRange ? newsDateRange.value : '7d';
    const category = newsCategory ? newsCategory.value : 'all';
    
    // Show loading state with an attractive spinner
    const newsContainer = document.getElementById('news-articles-container');
    if (newsContainer) {
        // Create a modern loading spinner
        newsContainer.innerHTML = `
            <div class="news-loading-container text-center py-5">
                <div class="spinner-container mb-3">
                    <div class="fancy-spinner">
                        <div class="ring"></div>
                        <div class="ring"></div>
                        <div class="dot"></div>
                    </div>
                </div>
                <div class="loading-message">
                    <h4 class="mb-3">Analyzing Financial News</h4>
                    <div class="loading-progress mb-3">
                        <div class="loading-progress-bar" id="news-loading-bar"></div>
                    </div>
                    <p class="text-muted" id="news-loading-text">Connecting to news sources...</p>
                </div>
            </div>
        `;
        
        // Animate the loading progress
        animateNewsLoading();
    }
    
    // Hide the load more button while loading
    if (loadMoreNewsBtn) loadMoreNewsBtn.style.display = 'none';
    
    // Show the main news section and hide any errors
    const newsSection = document.getElementById('news-section');
    const newsError = document.getElementById('news-error');
    
    if (newsSection) newsSection.style.display = 'block';
    if (newsError) newsError.style.display = 'none';
    
    try {
        // In a real app, this would be a fetch to an actual news API
        // For demo purposes, we'll generate mock data
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate mock news data
        newsData = generateMockNewsData(ticker, dateRange, category);
        
        if (newsData.length === 0) {
            showNoNewsMessage();
            isNewsLoading = false;
            return;
        }
        
        // Sort news data
        sortNewsArticles();
        
        // Show results
        showNewsResults();
        
        // Start real-time updates
        startRealTimeUpdates(ticker);
        
    } catch (error) {
        console.error('Error fetching news:', error);
        showNewsError('Failed to fetch news articles. Please try again later.');
    } finally {
        isNewsLoading = false;
    }
}

// Animate news loading progress
function animateNewsLoading() {
    const loadingBar = document.getElementById('news-loading-bar');
    const loadingText = document.getElementById('news-loading-text');
    if (!loadingBar || !loadingText) return;
    
    const loadingSteps = [
        { progress: 10, message: 'Connecting to news sources...', delay: 400 },
        { progress: 25, message: 'Gathering recent articles...', delay: 600 },
        { progress: 45, message: 'Analyzing sentiment...', delay: 500 },
        { progress: 70, message: 'Preparing market insights...', delay: 400 },
        { progress: 90, message: 'Almost done...', delay: 300 }
    ];
    
    let currentStep = 0;
    
    function nextStep() {
        if (currentStep < loadingSteps.length) {
            const step = loadingSteps[currentStep];
            loadingBar.style.width = `${step.progress}%`;
            loadingText.textContent = step.message;
            currentStep++;
            setTimeout(nextStep, step.delay);
        }
    }
    
    nextStep();
}

// Show message when no news is available
function showNoNewsMessage() {
    const newsContainer = document.getElementById('news-articles-container');
    if (newsContainer) {
        newsContainer.innerHTML = `
            <div class="alert alert-info text-center py-4">
                <i class="fas fa-newspaper fa-3x mb-3"></i>
                <h4>No News Articles Found</h4>
                <p>We couldn't find any news articles matching your criteria.</p>
                <button class="btn btn-primary mt-2" id="try-different-filters">Try Different Filters</button>
            </div>
        `;
        
        // Add event listener to the button
        document.getElementById('try-different-filters').addEventListener('click', showFilters);
    }
    
    // Hide the load more button
    if (loadMoreNewsBtn) loadMoreNewsBtn.style.display = 'none';
}

// Generate mock news data
function generateMockNewsData(ticker, dateRange, category) {
    console.log("Generating mock news data");
    
    try {
        const dateRangeValue = parseInt(dateRange);
        const categoryFilter = category;
        
        // Create a ticker-based seed for consistent mock data
        const seed = Array.from(ticker).reduce((sum, char) => sum + char.charCodeAt(0), 0);
        
        // Generate random number of articles (10-30)
        const articleCount = 10 + Math.floor((seed % 20));
        
        console.log(`Generating ${articleCount} mock news articles for ${ticker}`);
        
        // Initialize empty array for results
        const results = [];
        
        const now = new Date();
        const sources = ['Financial Times', 'Wall Street Journal', 'Bloomberg', 'CNBC', 'Reuters', 'MarketWatch'];
        const sentimentOptions = ['positive', 'neutral', 'negative'];
        const categoryOptions = ['general', 'financial', 'business', 'technology'];
        
        for (let i = 0; i < articleCount; i++) {
            // Generate a date within the selected range
            const articleDate = new Date();
            articleDate.setDate(now.getDate() - Math.floor(Math.random() * dateRangeValue));
            
            // Generate a semi-random sentiment based on ticker and article index
            const sentimentIndex = (seed + i) % 3;
            const sentiment = sentimentOptions[sentimentIndex];
            
            // Generate a semi-random category
            const category = categoryOptions[(seed + i) % categoryOptions.length];
            
            // Skip if category filter is applied and doesn't match
            if (categoryFilter !== 'all' && category !== categoryFilter) {
                continue;
            }
            
            // Generate a unique ID for each article
            const articleId = `article-${ticker}-${i}`;
            
            // Create article object
            const article = {
                id: articleId,
                source: sources[Math.floor(Math.random() * sources.length)],
                title: generateArticleTitle(ticker, sentiment),
                summary: generateArticleSummary(ticker, sentiment),
                url: 'javascript:void(0)',
                imageUrl: `https://source.unsplash.com/featured/300x200?business,${i + seed}`,
                date: articleDate,
                sentiment: sentiment,
                category: category,
                relevance: 100 - Math.floor(Math.random() * 30)
            };
            
            results.push(article);
        }
        
        // Default sort by date
        results.sort((a, b) => b.date - a.date);
        
        console.log(`Successfully generated ${results.length} mock news articles`);
        return results;
        
    } catch (error) {
        console.error("Error in generateMockNewsData:", error);
        return []; // Return empty array instead of throwing to prevent cascading errors
    }
}

// Generate article title based on ticker and sentiment
function generateArticleTitle(ticker, sentiment) {
    const companyName = newsTickerSelect.selectedIndex > -1 ? 
                        newsTickerSelect.options[newsTickerSelect.selectedIndex].text.split(' (')[0] : 
                        ticker;
    
    const positiveTitles = [
        `${companyName} Surges on Strong Quarterly Results`,
        `${companyName} Stock Hits New 52-Week High`,
        `Analysts Upgrade ${companyName} on Positive Outlook`,
        `${companyName} Announces Expansion Plans, Shares Rise`,
        `${companyName} Beats Market Expectations, Stock Jumps`
    ];
    
    const neutralTitles = [
        `${companyName} Reports Mixed Q2 Results`,
        `${companyName} Stock Trades Sideways After Earnings Call`,
        `${companyName} CEO Discusses Future Strategy in Interview`,
        `${companyName} Announces New Product Line`,
        `Industry Analysts Weigh In On ${companyName}'s Market Position`
    ];
    
    const negativeTitles = [
        `${companyName} Shares Fall After Disappointing Earnings`,
        `${companyName} Faces Regulatory Scrutiny, Stock Dips`,
        `Analysts Downgrade ${companyName} Citing Market Headwinds`,
        `${companyName} Announces Restructuring Plan, Shares Decline`,
        `${companyName} Misses Q3 Estimates, Stock Under Pressure`
    ];
    
    let titleList;
    switch (sentiment) {
        case 'positive':
            titleList = positiveTitles;
            break;
        case 'negative':
            titleList = negativeTitles;
            break;
        default:
            titleList = neutralTitles;
    }
    
    return titleList[Math.floor(Math.random() * titleList.length)];
}

// Generate article summary based on ticker and sentiment
function generateArticleSummary(ticker, sentiment) {
    const companyName = newsTickerSelect.selectedIndex > -1 ? 
                        newsTickerSelect.options[newsTickerSelect.selectedIndex].text.split(' (')[0] : 
                        ticker;
    
    const positiveSummaries = [
        `${companyName} reported quarterly earnings that exceeded analyst expectations, with revenue growing by 15% year-over-year. The company also raised its full-year guidance.`,
        `Shares of ${companyName} climbed after the company announced a significant new partnership that analysts say could drive substantial revenue growth in the coming quarters.`,
        `${companyName} unveiled its latest innovation today, which industry experts believe could give the company a competitive edge. The stock responded positively to the announcement.`
    ];
    
    const neutralSummaries = [
        `${companyName} met earnings expectations for the quarter but provided cautious guidance for the next period, citing ongoing market uncertainties.`,
        `At its annual investor day, ${companyName} outlined its strategic priorities for the next fiscal year, highlighting both opportunities and challenges in the current market environment.`,
        `Industry analysts maintain a hold rating on ${companyName} following its latest product announcement, noting both positive features and potential market headwinds.`
    ];
    
    const negativeSummaries = [
        `${companyName} shares declined after the company reported earnings below Wall Street estimates. Management cited supply chain issues and increased competition as key factors.`,
        `A recent analyst report downgraded ${companyName} from "buy" to "hold," expressing concerns about slowing growth rates and margin pressure in the company's core business segments.`,
        `${companyName} announced a major restructuring plan that includes workforce reductions, raising questions about the company's near-term growth prospects. The stock fell on the news.`
    ];
    
    let summaryList;
    switch (sentiment) {
        case 'positive':
            summaryList = positiveSummaries;
            break;
        case 'negative':
            summaryList = negativeSummaries;
            break;
        default:
            summaryList = neutralSummaries;
    }
    
    return summaryList[Math.floor(Math.random() * summaryList.length)];
}

// Show news results
function showNewsResults() {
    // Hide loading, show results
    document.getElementById('news-loading').style.display = 'none';
    
    // If no news, show empty state
    if (!newsData || newsData.length === 0) {
        document.getElementById('news-empty').style.display = 'block';
        return;
    }
    
    // Update news count
    const newsCount = document.getElementById('news-count');
    if (newsCount) {
        newsCount.textContent = `${newsData.length} articles`;
    }
    
    // Show results section
    document.getElementById('news-results').style.display = 'block';
    
    // Clear articles container
    const articlesContainer = document.getElementById('news-articles');
    if (articlesContainer) {
        articlesContainer.innerHTML = '';
    }
    
    // Show first page of articles
    displayNewsPage(1);
    
    // Update sentiment chart
    try {
        updateSentimentChart();
    } catch (error) {
        console.error("Error updating sentiment chart:", error);
    }
    
    // Show real-time updates section
    const realTimeUpdates = document.getElementById('real-time-updates');
    if (realTimeUpdates) {
        realTimeUpdates.style.display = 'block';
    }
}

// Display a page of news articles
function displayNewsPage(page) {
    const articlesContainer = document.getElementById('news-articles');
    const startIndex = (page - 1) * articlesPerPage;
    const endIndex = Math.min(startIndex + articlesPerPage, newsData.length);
    
    // Clear container if it's the first page
    if (page === 1) {
        articlesContainer.innerHTML = '';
    }
    
    // Add articles for this page
    for (let i = startIndex; i < endIndex; i++) {
        const article = newsData[i];
        const articleElement = createArticleElement(article);
        articlesContainer.appendChild(articleElement);
    }
    
    // Update load more button visibility
    loadMoreNewsBtn.style.display = endIndex < newsData.length ? 'inline-block' : 'none';
    
    // Update current page
    currentPage = page;
}

// Create DOM element for an article
function createArticleElement(article) {
    const articleDiv = document.createElement('div');
    articleDiv.className = 'news-card';
    
    const formattedDate = article.date.toLocaleDateString(undefined, {
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
    });
    
    let sentimentClass = '';
    let sentimentText = '';
    
    switch (article.sentiment) {
        case 'positive':
            sentimentClass = 'sentiment-positive';
            sentimentText = 'Positive';
            break;
        case 'negative':
            sentimentClass = 'sentiment-negative';
            sentimentText = 'Negative';
            break;
        default:
            sentimentClass = 'sentiment-neutral';
            sentimentText = 'Neutral';
    }
    
    // Generate a proper mock URL for the article that will actually work
    const articleTitle = encodeURIComponent(article.title);
    const mockNewsUrl = `https://example.com/financial-news/${article.id}?title=${articleTitle}&source=${encodeURIComponent(article.source)}`;
    
    // Create a function to handle article click that will open a new page with content
    articleDiv.innerHTML = `
        <div class="news-image">
            <img src="${article.imageUrl}" alt="${article.title}" loading="lazy">
        </div>
        <div class="news-content-wrapper">
            <div class="news-source">
                <span class="news-source-name">${article.source}</span>
                <span class="news-date">${formattedDate}</span>
            </div>
            <h3 class="news-title">${article.title}</h3>
            <p class="news-summary">${article.summary}</p>
            <div class="news-footer">
                <span class="news-sentiment ${sentimentClass}">${sentimentText}</span>
                <a href="#" class="news-read-more" data-article-id="${article.id}" target="_blank">
                    Read More <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        </div>
    `;
    
    // Add event listener to handle the read more click
    const readMoreLink = articleDiv.querySelector('.news-read-more');
    readMoreLink.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Create a simple HTML page with the article content
        const articleHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${article.title}</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background-color: #f8f9fa;
                    padding-top: 2rem;
                }
                .article-container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                    padding: 2rem;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .article-header {
                    border-bottom: 1px solid #eee;
                    padding-bottom: 1rem;
                    margin-bottom: 2rem;
                }
                .article-meta {
                    color: #6c757d;
                    font-size: 0.9rem;
                    margin-bottom: 1rem;
                }
                .article-image {
                    width: 100%;
                    height: 400px;
                    object-fit: cover;
                    border-radius: 8px;
                    margin-bottom: 2rem;
                }
                .article-content p {
                    margin-bottom: 1.5rem;
                    font-size: 1.1rem;
                }
                .article-sentiment {
                    display: inline-block;
                    padding: 0.35rem 0.65rem;
                    border-radius: 50px;
                    font-weight: 600;
                    font-size: 0.85rem;
                    margin-top: 1rem;
                }
                .sentiment-positive {
                    background-color: rgba(40, 167, 69, 0.2);
                    color: #28a745;
                }
                .sentiment-negative {
                    background-color: rgba(220, 53, 69, 0.2);
                    color: #dc3545;
                }
                .sentiment-neutral {
                    background-color: rgba(108, 117, 125, 0.2);
                    color: #6c757d;
                }
                .back-link {
                    margin-top: 2rem;
                    display: inline-block;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="article-container">
                    <div class="article-header">
                        <h1>${article.title}</h1>
                        <div class="article-meta">
                            <span class="source"><i class="fas fa-newspaper me-1"></i> ${article.source}</span>
                            <span class="date ms-3"><i class="far fa-calendar-alt me-1"></i> ${formattedDate}</span>
                        </div>
                    </div>
                    
                    <img src="${article.imageUrl}" alt="${article.title}" class="article-image">
                    
                    <div class="article-content">
                        <p>${article.summary}</p>
                        <p>${generateExtendedContent(article.title, article.sentiment)}</p>
                        <p>${generateExtendedContent(article.title, article.sentiment)}</p>
                        <p>${generateExtendedContent(article.title, article.sentiment)}</p>
                        
                        <div class="article-sentiment sentiment-${article.sentiment}">
                            <i class="fas fa-chart-line me-1"></i> ${sentimentText} Sentiment
                        </div>
                    </div>
                    
                    <a href="javascript:window.close();" class="back-link btn btn-outline-primary mt-4">
                        <i class="fas fa-arrow-left me-1"></i> Back to News
                    </a>
                </div>
                
                <div class="text-center text-muted my-4">
                    <small>This is a demo article generated for the Stock Prediction application.</small>
                </div>
            </div>
        </body>
        </html>
        `;
        
        // Open a new window with the article content
        const articleWindow = window.open('', '_blank');
        articleWindow.document.write(articleHTML);
        articleWindow.document.close();
    });
    
    return articleDiv;
}

// Generate extended content for the full article view
function generateExtendedContent(title, sentiment) {
    const companyName = title.split(' ')[0]; // Get the first word as company name
    
    const positiveParagraphs = [
        `Analysts are optimistic about ${companyName}'s growth trajectory, pointing to strong fundamentals and encouraging market conditions. The company's recent strategic initiatives appear to be paying off, with several key performance indicators showing positive momentum.`,
        `Institutional investors have been increasing their positions in ${companyName}, signaling confidence in the company's long-term prospects. Market sentiment remains bullish as the company continues to outperform expectations.`,
        `${companyName}'s leadership team has been praised for their forward-thinking approach and ability to navigate challenging market conditions. Industry experts believe the company is well-positioned to capitalize on emerging opportunities in the sector.`
    ];
    
    const neutralParagraphs = [
        `Market watchers remain divided on ${companyName}'s outlook, with some pointing to potential headwinds while others highlight opportunities for growth. The company's performance has been in line with broader market trends.`,
        `${companyName} faces both challenges and opportunities in the current economic climate. While certain segments of their business show promise, others may require strategic reassessment according to industry analysts.`,
        `Investors are closely monitoring ${companyName}'s next moves as the company navigates a complex competitive landscape. Recent developments have neither significantly strengthened nor weakened its market position.`
    ];
    
    const negativeParagraphs = [
        `Concerns are mounting regarding ${companyName}'s ability to maintain growth in an increasingly competitive market. Several analysts have revised their forecasts downward, citing structural challenges facing the company.`,
        `${companyName} may need to reassess its strategy as recent performance indicators point to potential weaknesses in key business segments. Market skepticism has grown following the latest developments.`,
        `Investors are proceeding with caution regarding ${companyName} as the company faces headwinds on multiple fronts. The recent market reaction reflects growing uncertainty about future performance.`
    ];
    
    let paragraphList;
    switch (sentiment) {
        case 'positive':
            paragraphList = positiveParagraphs;
            break;
        case 'negative':
            paragraphList = negativeParagraphs;
            break;
        default:
            paragraphList = neutralParagraphs;
    }
    
    return paragraphList[Math.floor(Math.random() * paragraphList.length)];
}

// Sort news articles based on selected sort option
function sortNewsArticles() {
    const sortBy = newsSort.value;
    
    switch (sortBy) {
        case 'date':
            newsData.sort((a, b) => b.date - a.date);
            break;
        case 'relevance':
            newsData.sort((a, b) => b.relevance - a.relevance);
            break;
        case 'sentiment':
            // Sort positive first, then neutral, then negative
            newsData.sort((a, b) => {
                const sentimentValues = { 'positive': 3, 'neutral': 2, 'negative': 1 };
                return sentimentValues[b.sentiment] - sentimentValues[a.sentiment];
            });
            break;
    }
    
    // Reset to first page and show results
    currentPage = 1;
    displayNewsPage(1);
}

// Load more news articles
function loadMoreNews() {
    displayNewsPage(currentPage + 1);
}

// Show filters when no results are found
function showFilters() {
    // Just close the empty state and let the user change filters
    document.getElementById('news-empty').style.display = 'none';
}

// Show news error
function showNewsError(message) {
    document.getElementById('news-loading').style.display = 'none';
    document.getElementById('news-results').style.display = 'none';
    document.getElementById('news-empty').style.display = 'none';
    
    const errorElement = document.getElementById('news-error');
    document.getElementById('news-error-message').textContent = message;
    errorElement.style.display = 'block';
}

// Update sentiment chart with current news data
function updateSentimentChart() {
    console.log("Updating sentiment chart");
    
    // Validate chart instance and container
    if (!sentimentChart) {
        console.error("Sentiment chart not initialized");
        initializeSentimentChart();
        
        if (!sentimentChart) {
            console.error("Failed to initialize sentiment chart");
            return;
        }
    }
    
    // Validate news data
    if (!newsData || !Array.isArray(newsData) || newsData.length === 0) {
        console.log("No news data available for sentiment chart");
        return;
    }
    
    try {
        // Count sentiments
        const sentimentCounts = {
            positive: 0,
            neutral: 0,
            negative: 0
        };
        
        newsData.forEach(article => {
            if (article && article.sentiment && sentimentCounts.hasOwnProperty(article.sentiment)) {
                sentimentCounts[article.sentiment]++;
            }
        });
        
        // Update chart data
        sentimentChart.data.datasets[0].data = [
            sentimentCounts.positive,
            sentimentCounts.neutral,
            sentimentCounts.negative
        ];
        
        sentimentChart.update();
        
        // Update sentiment summary text
        const total = newsData.length;
        const sentimentSummary = document.getElementById('sentiment-summary');
        
        if (total > 0 && sentimentSummary) {
            const posPercent = Math.round((sentimentCounts.positive / total) * 100);
            const negPercent = Math.round((sentimentCounts.negative / total) * 100);
            
            let sentimentMessage = '';
            if (posPercent > negPercent + 20) {
                sentimentMessage = 'Very positive media coverage';
            } else if (posPercent > negPercent) {
                sentimentMessage = 'Somewhat positive media coverage';
            } else if (negPercent > posPercent + 20) {
                sentimentMessage = 'Very negative media coverage';
            } else if (negPercent > posPercent) {
                sentimentMessage = 'Somewhat negative media coverage';
            } else {
                sentimentMessage = 'Neutral media coverage';
            }
            
            sentimentSummary.textContent = sentimentMessage;
        }
        
        console.log("Sentiment chart updated successfully");
    } catch (error) {
        console.error("Error in updateSentimentChart:", error);
    }
}

// Start real-time price updates
function startRealTimeUpdates(ticker) {
    // Clear any existing interval
    if (realTimeUpdateInterval) {
        clearInterval(realTimeUpdateInterval);
    }
    
    console.log(`Starting real-time updates for ${ticker}`);
    
    // Show loading state for real-time updates
    const realTimeContainer = document.getElementById('real-time-container');
    if (realTimeContainer) {
        realTimeContainer.innerHTML = `
            <div class="text-center py-3 mb-3">
                <div class="spinner-border text-primary" role="status" style="width: 1.5rem; height: 1.5rem;"></div>
                <span class="ms-2">Connecting to market data...</span>
            </div>
        `;
    }
    
    // Generate initial price data (simulated for demo)
    const initialPrice = 100 + Math.random() * 400; // Random price between 100 and 500
    
    // Wait a moment before showing data to simulate connection time
    setTimeout(() => {
        // Initialize real-time chart data if it exists
        if (realTimeChart) {
            // Clear existing data
            realTimeChart.data.labels = [];
            realTimeChart.data.datasets[0].data = [];
            
            // Add initial data point (current time)
            const now = new Date();
            realTimeChart.data.labels.push(now.toLocaleTimeString());
            realTimeChart.data.datasets[0].data.push(initialPrice);
            realTimeChart.update();
        }
        
        // Initialize displays
        updatePriceDisplay(initialPrice);
        updateChangeStats(initialPrice);
        updateMarketStats(initialPrice);
        
        // Show the real-time container with data
        if (realTimeContainer) {
            realTimeContainer.innerHTML = `
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <div class="real-time-chart-container">
                            <canvas id="real-time-chart"></canvas>
                        </div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <div class="row">
                            <div class="col-6 mb-3">
                                <div class="real-time-stat">
                                    <div class="stat-label">Current Price</div>
                                    <div class="stat-value" id="rt-current-price">$0.00</div>
                                </div>
                            </div>
                            <div class="col-6 mb-3">
                                <div class="real-time-stat">
                                    <div class="stat-label">Price Change</div>
                                    <div class="stat-value" id="rt-price-change">0.00%</div>
                                </div>
                            </div>
                            <div class="col-6 mb-3">
                                <div class="real-time-stat">
                                    <div class="stat-label">Volume</div>
                                    <div class="stat-value" id="rt-volume">0</div>
                                </div>
                            </div>
                            <div class="col-6 mb-3">
                                <div class="real-time-stat">
                                    <div class="stat-label">Market Cap</div>
                                    <div class="stat-value" id="rt-market-cap">$0.00M</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="d-flex justify-content-between mt-3">
                    <div><small class="text-muted"><i class="fas fa-info-circle me-1"></i> Demo data - refreshes every 3 seconds</small></div>
                    <div><small class="text-muted" id="rt-last-update"></small></div>
                </div>
            `;
            
            // Re-initialize the real-time chart since we rebuilt the container
            initializeRealTimeChart();
            
            // Add initial data point (current time)
            const now = new Date();
            realTimeChart.data.labels.push(now.toLocaleTimeString());
            realTimeChart.data.datasets[0].data.push(initialPrice);
            realTimeChart.update();
            
            // Initialize displays
            updatePriceDisplay(initialPrice);
            updateChangeStats(initialPrice);
            updateMarketStats(initialPrice);
        }
        
        // Set up interval for regular updates
        let lastPrice = initialPrice;
        realTimeUpdateInterval = setInterval(() => {
            // Generate next price (random walk)
            const newPrice = generateNextPrice(lastPrice);
            
            // Update the UI with the new price
            updateRealTimeData(newPrice);
            
            // Update last price for next iteration
            lastPrice = newPrice;
        }, 3000); // Update every 3 seconds
    }, 1500); // Simulate connection time
}

// Generate next price movement (semi-random with trend)
function generateNextPrice(lastPrice) {
    // Random movement with slight drift
    const movement = (Math.random() - 0.48) * lastPrice * 0.02;
    return Math.max(lastPrice + movement, 0.01);
}

// Update real-time price data display
function updateRealTimeData(price) {
    try {
        // Make sure we have a valid chart instance
        if (!realTimeChart || !realTimeChart.data) {
            console.error("Invalid chart instance in updateRealTimeData");
            return;
        }
        
        // Make sure the real-time updates section is visible
        const realTimeUpdates = document.getElementById('real-time-updates');
        if (realTimeUpdates) {
            realTimeUpdates.style.display = 'block';
        }
        
        // Add new data point to chart
        const now = new Date();
        const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Limit chart to 20 data points for better visualization
        if (realTimeChart.data.labels.length >= 20) {
            realTimeChart.data.labels.shift();
            realTimeChart.data.datasets[0].data.shift();
        }
        
        // Add new data point
        realTimeChart.data.labels.push(timeLabel);
        realTimeChart.data.datasets[0].data.push(price);
        
        // Update the chart
        try {
            realTimeChart.update();
        } catch (chartError) {
            console.error("Error updating chart:", chartError);
            // Attempt to recover by restarting
            setTimeout(() => startRealTimeUpdates(), 1000);
            return;
        }
        
        // Update all UI elements
        updatePriceDisplay(price);
        updateChangeStats(price);
        updateMarketStats(price);
        
    } catch (error) {
        console.error("Error in updateRealTimeData:", error);
    }
}

// Update the current price display
function updatePriceDisplay(price) {
    const currentPriceElement = document.getElementById('rt-current-price');
    if (currentPriceElement) {
        currentPriceElement.textContent = `$${price.toFixed(2)}`;
    }
    
    // Update last updated time
    const lastUpdatedElement = document.getElementById('rt-last-updated');
    if (lastUpdatedElement) {
        lastUpdatedElement.textContent = new Date().toLocaleTimeString();
    }
}

// Update price change statistics
function updateChangeStats(price) {
    // Calculate change only if we have more than one data point
    if (!realTimeChart || !realTimeChart.data || !realTimeChart.data.datasets || 
        !realTimeChart.data.datasets[0] || !realTimeChart.data.datasets[0].data || 
        realTimeChart.data.datasets[0].data.length <= 1) {
        return;
    }
    
    const firstPrice = realTimeChart.data.datasets[0].data[0];
    const change = price - firstPrice;
    const percentChange = (change / firstPrice) * 100;
    
    const changeDisplay = `${change > 0 ? '+' : ''}${change.toFixed(2)} (${percentChange > 0 ? '+' : ''}${percentChange.toFixed(2)}%)`;
    const priceChangeElement = document.getElementById('rt-price-change');
    
    if (priceChangeElement) {
        priceChangeElement.textContent = changeDisplay;
        priceChangeElement.className = change >= 0 ? 'positive' : 'negative';
    }
}

// Update market statistics
function updateMarketStats(price) {
    // Generate random market stats based on the current price
    const open = price * (1 - Math.random() * 0.05);
    const high = price * (1 + Math.random() * 0.02);
    const low = price * (1 - Math.random() * 0.02);
    const volume = Math.floor(Math.random() * 10000000);
    const marketCap = (price * (Math.random() * 100 + 50)).toFixed(2);
    
    // Update all statistics with null checks
    updateElementText('rt-open', `$${open.toFixed(2)}`);
    updateElementText('rt-high', `$${high.toFixed(2)}`);
    updateElementText('rt-low', `$${low.toFixed(2)}`);
    updateElementText('rt-volume', volume.toLocaleString());
    updateElementText('rt-market-cap', `$${(marketCap / 1000).toFixed(2)}B`);
}

// Helper function to update element text with null check
function updateElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
} 