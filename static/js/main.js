// Global variables
let stockData = [];
let selectedColumn = "";
let columns = [];
let currentCompany = ""; // Track the current company name
let isDataFetching = false; // Track if data is currently being fetched

// DOM elements - add null checks to prevent errors
const fetchDataBtn = document.getElementById("fetch-data-btn");
const tickerSelect = document.getElementById("ticker-select");
const startDateInput = document.getElementById("start-date");
const endDateInput = document.getElementById("end-date");
const modelSelect = document.getElementById("model-select");
const seqLengthSlider = document.getElementById("seq-length");
const seqLengthValue = document.getElementById("seq-length-value");
const lstmParams = document.getElementById("lstm-params");
const sarimaxParams = document.getElementById("sarimax-params");
const loadingSpinner = document.getElementById("loading-spinner");

// Check if essential elements exist
if (
  !fetchDataBtn ||
  !tickerSelect ||
  !startDateInput ||
  !endDateInput ||
  !modelSelect
) {
  console.error("Essential DOM elements missing");
  // Continue anyway, but log the error to help with debugging
}

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  // Set default dates
  setDefaultDates();

  // Setup event listeners
  setupEventListeners();

  // Add navigation event listeners
  setupNavigation();

  // Set theme based on user preference
  setInitialTheme();
});

// Setup event listeners
function setupEventListeners() {
  // Fetch data button
  fetchDataBtn.addEventListener("click", fetchStockData);

  // Ticker selection change
  tickerSelect.addEventListener("change", function () {
    // Get the selected company name
    const selectedCompany =
      tickerSelect.options[tickerSelect.selectedIndex].text;
    // Update the UI with the selected company
    updateCompanyDisplay(selectedCompany);
    // Automatically fetch data when ticker changes
    fetchStockData();
  });

  // Event listeners for model selection and parameters
  modelSelect.addEventListener("change", toggleModelParams);
  seqLengthSlider.addEventListener("input", updateSeqLengthValue);

  // Initialize the sequence length value display
  updateSeqLengthValue();

  // Initialize model parameters visibility
  toggleModelParams();

  // Initialize theme
  initTheme();

  // Initialize AOS animation library
  AOS.init({
    duration: 800,
    easing: "ease-out",
    once: true,
  });

  // Technical indicators apply button
  document
    .getElementById("apply-indicators")
    .addEventListener("click", function () {
      applyTechnicalIndicators();
    });

  // Theme toggle event listener
  document
    .getElementById("theme-toggle")
    .addEventListener("click", function () {
      toggleTheme();
    });

  // Handle video background
  setupVideoBackground();

  // Add animation for content sections
  document.querySelectorAll(".content-card, .feature-card").forEach((card) => {
    card.classList.add("content-appear");
  });

  // Add hover effect for feature cards
  document.querySelectorAll(".feature-card").forEach((card) => {
    card.addEventListener("mouseenter", function () {
      const icon = this.querySelector(".feature-icon i");
      icon.classList.add("fa-beat");
      setTimeout(() => {
        icon.classList.remove("fa-beat");
      }, 1000);
    });
  });
}

// Initialize theme based on user preference or localStorage
function initTheme() {
  // Check if theme was previously set
  const savedTheme = localStorage.getItem("theme");

  // Check user preference
  const userPrefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  // Set theme based on localStorage or user preference
  if (savedTheme === "dark" || (!savedTheme && userPrefersDark)) {
    document.documentElement.setAttribute("data-theme", "dark");
    document.getElementById("theme-toggle").innerHTML =
      '<i class="fas fa-sun"></i>';
  } else {
    document.documentElement.setAttribute("data-theme", "light");
    document.getElementById("theme-toggle").innerHTML =
      '<i class="fas fa-moon"></i>';
  }

  // Listen for changes in user preference
  if (window.matchMedia) {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        if (!localStorage.getItem("theme")) {
          if (e.matches) {
            document.documentElement.setAttribute("data-theme", "dark");
            document.getElementById("theme-toggle").innerHTML =
              '<i class="fas fa-sun"></i>';
          } else {
            document.documentElement.setAttribute("data-theme", "light");
            document.getElementById("theme-toggle").innerHTML =
              '<i class="fas fa-moon"></i>';
          }
        }
      });
  }
}

// Toggle between light and dark themes
function toggleTheme() {
  const currentTheme =
    document.documentElement.getAttribute("data-theme") || "light";
  const newTheme = currentTheme === "light" ? "dark" : "light";

  // Update the data-theme attribute
  document.documentElement.setAttribute("data-theme", newTheme);

  // Update theme toggle icon
  document.getElementById("theme-toggle").innerHTML =
    newTheme === "dark"
      ? '<i class="fas fa-sun"></i>'
      : '<i class="fas fa-moon"></i>';

  // Save theme preference to localStorage
  localStorage.setItem("theme", newTheme);

  // Update Plotly charts with the new theme
  updatePlotsTheme(newTheme);
}

// Update Plotly charts when theme changes
function updatePlotsTheme(theme) {
  const plotIds = [
    "stock-plot",
    "trend-plot",
    "seasonal-plot",
    "residual-plot",
    "prediction-plot",
    "components-plot",
  ];
  const bgColor = theme === "dark" ? "#1e1e1e" : "#ffffff";
  const gridColor = theme === "dark" ? "#333333" : "#eeeeee";
  const textColor = theme === "dark" ? "#f0f0f0" : "#333333";

  plotIds.forEach((id) => {
    const plotDiv = document.getElementById(id);
    if (plotDiv && plotDiv.data && plotDiv.data.length > 0) {
      Plotly.update(
        id,
        {},
        {
          paper_bgcolor: bgColor,
          plot_bgcolor: bgColor,
          font: { color: textColor },
          xaxis: { gridcolor: gridColor, zerolinecolor: gridColor },
          yaxis: { gridcolor: gridColor, zerolinecolor: gridColor },
        }
      );
    }
  });
}

// Toggle model parameters display
function toggleModelParams() {
  const selectedModel = modelSelect.value;

  // Reset previous model results when changing models
  const modelSection = document.getElementById("model-section");
  if (modelSection) {
    modelSection.style.display = "none";
  }

  // Clear any previous error messages or results
  const predictionPlot = document.getElementById("prediction-plot");
  if (predictionPlot) {
    predictionPlot.innerHTML = "";
  }

  // Hide all parameter sections first
  if (lstmParams) lstmParams.style.display = "none";

  const transformerParams = document.getElementById("transformer-params");
  if (transformerParams) transformerParams.style.display = "none";

  const prophetParams = document.getElementById("prophet-params");
  if (prophetParams) prophetParams.style.display = "none";

  // Show the selected model parameters
  switch (selectedModel) {
    case "LSTM":
      if (lstmParams) lstmParams.style.display = "block";
      break;
    case "Transformer":
      if (transformerParams) transformerParams.style.display = "block";
      break;
    case "Prophet":
      if (prophetParams) prophetParams.style.display = "block";
      break;
  }

  console.log(`Selected model: ${selectedModel}`);
}

// Update sequence length value display
function updateSeqLengthValue() {
  seqLengthValue.textContent = seqLengthSlider.value;
}

// Enhanced loading functions
function showLoading(message = "Processing data, please wait...") {
  // Show global loading spinner
  loadingSpinner.style.display = "flex";
  loadingSpinner.querySelector("p").textContent = message;

  // Disable all buttons and selects
  document.querySelectorAll("button, select, input").forEach((element) => {
    if (!element.classList.contains("nav-link")) {
      element.disabled = true;
    }
  });
}

function hideLoading() {
  // Hide global loading spinner
  loadingSpinner.style.display = "none";

  // Enable all buttons and selects
  document.querySelectorAll("button, select, input").forEach((element) => {
    element.disabled = false;
  });

  // Remove all section loading overlays
  document.querySelectorAll(".section-loading").forEach((element) => {
    element.classList.remove("section-loading");
    element.removeAttribute("data-loading-text");
  });
}

// Show loading overlay on a specific section
function showSectionLoading(sectionId, loadingText) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.add("section-loading");
    section.setAttribute("data-loading-text", loadingText);
  }
}

// Hide loading overlay on a specific section
function hideSectionLoading(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.remove("section-loading");
    section.removeAttribute("data-loading-text");
  }
}

// Show skeleton loader
function showSkeletonLoader(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = "block";
  }
}

// Hide skeleton loader
function hideSkeletonLoader(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = "none";
  }
}

// Show model loading with progress
function showModelLoading(initialMessage = "Preparing model...") {
  const modelLoading = document.getElementById("model-loading");
  const modelLoadingText = document.getElementById("model-loading-text");
  const progressBar = document.getElementById("model-progress-bar");

  if (modelLoading && modelLoadingText && progressBar) {
    // Hide metrics and plots
    document.getElementById("metrics-section").style.display = "none";
    document.getElementById("prediction-plot").style.display = "none";
    document.getElementById("components-plot").style.display = "none";

    // Show loading spinner
    modelLoading.style.display = "flex";
    modelLoadingText.textContent = initialMessage;
    progressBar.style.width = "0%";

    // Start progress animation
    simulateModelProgress();
  }
}

// Hide model loading
function hideModelLoading() {
  const modelLoading = document.getElementById("model-loading");

  if (modelLoading) {
    modelLoading.style.display = "none";

    // Show metrics and plots
    document.getElementById("metrics-section").style.display = "flex";
    document.getElementById("prediction-plot").style.display = "block";
  }
}

// Update model loading progress
function updateModelProgress(progress, message) {
  const progressBar = document.getElementById("model-progress-bar");
  const modelLoadingText = document.getElementById("model-loading-text");

  if (progressBar && modelLoadingText) {
    progressBar.style.width = `${progress}%`;
    if (message) {
      modelLoadingText.textContent = message;
    }
  }
}

// Simulate model progress for better UX
function simulateModelProgress() {
  const progressSteps = [
    { progress: 10, message: "Preprocessing data...", delay: 500 },
    { progress: 25, message: "Building model architecture...", delay: 800 },
    { progress: 40, message: "Training model...", delay: 1200 },
    { progress: 60, message: "Optimizing parameters...", delay: 1000 },
    { progress: 75, message: "Evaluating model...", delay: 800 },
    { progress: 90, message: "Generating predictions...", delay: 700 },
  ];

  let currentStep = 0;

  function nextStep() {
    if (currentStep < progressSteps.length) {
      const step = progressSteps[currentStep];
      updateModelProgress(step.progress, step.message);
      currentStep++;
      setTimeout(nextStep, step.delay);
    }
  }

  nextStep();
}

// Fetch stock data from API
async function fetchStockData() {
  console.log("fetchStockData called - starting data fetch process");

  // Prevent multiple simultaneous fetch requests
  if (isDataFetching) {
    console.log(
      "A data fetch operation is already in progress. Skipping this request."
    );
    return;
  }

  isDataFetching = true;

  // Show loading state
  showLoading("Fetching stock data...");
  showSkeletonLoader("data-skeleton");

  try {
    // IMPORTANT: Clear previous data and results BEFORE fetching
    // This ensures we start fresh with each new fetch
    console.log("Clearing previous data and UI elements");

    // Clear previous data and models
    stockData = [];
    selectedColumn = "";
    columns = [];

    // Hide content sections when fetching new data
    document.getElementById("data-section").style.display = "none";
    document.getElementById("viz-section").style.display = "none";
    document.getElementById("stationarity-section").style.display = "none";
    document.getElementById("decomposition-section").style.display = "none";
    document.getElementById("model-section").style.display = "none";

    // Reset any previous result displays
    const predictionPlot = document.getElementById("prediction-plot");
    if (predictionPlot) {
      predictionPlot.innerHTML = "";
    }

    // Reset chart canvases if they exist
    [
      "stock-plot",
      "trend-plot",
      "seasonal-plot",
      "residual-plot",
      "prediction-plot",
      "components-plot",
    ].forEach((plotId) => {
      const plotElement = document.getElementById(plotId);
      if (plotElement) {
        while (plotElement.firstChild) {
          plotElement.removeChild(plotElement.firstChild);
        }
      }
    });

    // Get the current company name for display
    currentCompany = "";
    if (tickerSelect && tickerSelect.selectedIndex >= 0) {
      currentCompany = tickerSelect.options[tickerSelect.selectedIndex].text;
      console.log(
        `Fetching data for ${currentCompany} (${tickerSelect.value})`
      );
    } else {
      console.log(`Fetching data for ticker: ${tickerSelect.value}`);
    }

    // Update UI to show current company
    updateCompanyDisplay(currentCompany || tickerSelect.value);

    // Get current ticker value
    const tickerValue = tickerSelect.value;
    if (!tickerValue) {
      throw new Error(
        "No ticker symbol selected. Please select a company or enter a custom ticker."
      );
    }

    // Make the API request
    console.log(`Sending API request for ${tickerValue}`);
    const response = await fetch("/api/stock-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ticker: tickerValue,
        start_date: startDateInput.value,
        end_date: endDateInput.value,
      }),
    });

    if (!response.ok) {
      console.error(`HTTP error: ${response.status}`);
      if (response.status === 404) {
        // Create a more informative and attractive popup for 404 errors
        const errorModalHTML = `
                    <div class="modal fade" id="dataErrorModal" tabindex="-1" aria-hidden="true">
                        <div class="modal-dialog modal-dialog-centered">
                            <div class="modal-content">
                                <div class="modal-header bg-danger text-white">
                                    <h5 class="modal-title"><i class="fas fa-exclamation-triangle me-2"></i>Data Unavailable</h5>
                                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div class="modal-body">
                                    <p>We couldn't find data for <strong>${
                                      currentCompany || tickerValue
                                    }</strong> in our data sources.</p>
                                    <p>This could be due to one of the following reasons:</p>
                                    <ul>
                                        <li>The ticker symbol may be incorrect</li>
                                        <li>Data for this company is not available in our current data providers</li>
                                        <li>The selected date range may be invalid</li>
                                        <li>There might be temporary connectivity issues with our data providers</li>
                                    </ul>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                    <button type="button" class="btn btn-primary" data-bs-dismiss="modal" id="tryDifferentTicker">Try Different Ticker</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

        // Add the modal to the document body if it doesn't exist
        if (!document.getElementById("dataErrorModal")) {
          const modalContainer = document.createElement("div");
          modalContainer.innerHTML = errorModalHTML;
          document.body.appendChild(modalContainer.firstChild);

          // Add event listener for the "Try Different Ticker" button
          document
            .getElementById("tryDifferentTicker")
            .addEventListener("click", function () {
              // Focus on the custom ticker input
              forecastCustomTicker.focus();
            });
        }

        // Show the modal
        const errorModal = new bootstrap.Modal(
          document.getElementById("dataErrorModal")
        );
        errorModal.show();

        throw new Error(
          `No data available for ${
            currentCompany || tickerValue
          }. Please try a different company or ticker symbol.`
        );
      }
      throw new Error(`Failed to fetch stock data: ${response.statusText}`);
    }

    // Parse the JSON response
    console.log("Parsing response from server");
    let result;
    try {
      result = await response.json();
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      throw new Error("Failed to parse the server response. Please try again.");
    }

    if (result.error) {
      console.error(`API error: ${result.error}`);
      throw new Error(result.error);
    }

    // Validate the response data
    if (
      !result.data ||
      !Array.isArray(result.data) ||
      result.data.length === 0
    ) {
      console.error("Received empty or invalid data from API");

      // Show a friendly modal for empty data
      const emptyDataModalHTML = `
                <div class="modal fade" id="emptyDataModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header bg-warning">
                                <h5 class="modal-title"><i class="fas fa-exclamation-circle me-2"></i>No Data Available</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <p>We received a response from our data provider, but no data was available for <strong>${
                                  currentCompany || tickerValue
                                }</strong> in the selected date range.</p>
                                <p>You can try:</p>
                                <ul>
                                    <li>Selecting a wider date range</li>
                                    <li>Checking if the company is publicly traded during the selected period</li>
                                    <li>Using a different ticker symbol</li>
                                </ul>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" class="btn btn-primary" id="adjustDateRange" data-bs-dismiss="modal">Adjust Date Range</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

      // Add the modal to the document body if it doesn't exist
      if (!document.getElementById("emptyDataModal")) {
        const modalContainer = document.createElement("div");
        modalContainer.innerHTML = emptyDataModalHTML;
        document.body.appendChild(modalContainer.firstChild);

        // Add event listener for adjusting date range
        document
          .getElementById("adjustDateRange")
          .addEventListener("click", function () {
            // Focus on the start date input
            startDateInput.focus();
          });
      }

      // Show the modal
      const emptyDataModal = new bootstrap.Modal(
        document.getElementById("emptyDataModal")
      );
      emptyDataModal.show();

      throw new Error(
        "No data available for this company. Please try a different ticker or date range."
      );
    }

    console.log(
      `Successfully fetched data for ${currentCompany || tickerValue}: ${
        result.data.length
      } records from ${result.source}`
    );

    // Store data globally
    stockData = result.data;
    columns = result.columns;

    // Hide skeleton and display data
    hideSkeletonLoader("data-skeleton");

    // Display data and create visualization
    displayStockData(stockData, columns, result.source);

    // Setup export button
    setupExportButton(stockData, columns);

    // Update data summary in the footer
    updateDataSummary(stockData, columns);

    // Create visualization
    showSkeletonLoader("plot-skeleton");
    setTimeout(() => {
      createStockPlot(stockData, columns);
      hideSkeletonLoader("plot-skeleton");
    }, 800); // Add a small delay for better UX

    // Populate column select
    populateColumnSelect(columns);

    // Show relevant sections and scroll to data section
    document.getElementById("data-section").style.display = "block";
    document.getElementById("viz-section").style.display = "block";

    // Scroll to data section
    document.getElementById("data-section").scrollIntoView({
      behavior: "smooth",
    });

    console.log("Data fetch and display completed successfully");
  } catch (error) {
    console.error("Error fetching stock data:", error);

    // Don't show the error message if we've already shown a modal
    if (
      !document.getElementById("dataErrorModal")?.classList.contains("show") &&
      !document.getElementById("emptyDataModal")?.classList.contains("show")
    ) {
      showErrorMessage("Error fetching stock data: " + error.message);
    }

    hideSkeletonLoader("data-skeleton");
  } finally {
    hideLoading();
    isDataFetching = false; // Reset fetching flag
  }
}

// Update company display throughout the UI
function updateCompanyDisplay(companyName) {
  // Update the company alert in the forecast section
  const companyAlert = document.getElementById("company-alert");
  const companyDisplay = document.getElementById("current-company-display");

  if (companyAlert && companyDisplay) {
    companyDisplay.textContent = companyName;
    companyAlert.style.display = "block";
  }

  // Update forecast title
  const forecastTitle = document.getElementById("forecast-title");
  if (forecastTitle) {
    forecastTitle.textContent = `Stock Forecasting: ${companyName}`;
  }

  // Update any other UI elements with the current company name
  const companyInfoElements = document.querySelectorAll(
    ".current-company-info"
  );
  companyInfoElements.forEach((el) => {
    el.textContent = companyName;
  });
}

// Show error message
function showErrorMessage(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "alert alert-danger alert-dismissible fade show mt-3";
  errorDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

  // Insert the error message after the fetch button
  fetchDataBtn.parentNode.insertAdjacentElement("afterend", errorDiv);

  // Remove the error message after 5 seconds
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

// Display stock data in table
function displayStockData(data, columns, source = "Stooq") {
  // Add safety check for empty data
  if (!data || data.length === 0 || !columns || columns.length === 0) {
    console.error("No data or columns provided to displayStockData");
    showErrorMessage(
      "Error: No data available to display. Please try with a different ticker or date range."
    );
    return;
  }

  // Add null checks for all elements
  const tableHeader = document.getElementById("table-header");
  const tableBody = document.getElementById("table-body");
  const dataInfo = document.getElementById("data-info");

  // Make sure all elements exist before proceeding
  if (!tableHeader || !tableBody || !dataInfo) {
    console.error("One or more table elements not found");
    showErrorMessage(
      "Error: Some table elements not found. Please refresh the page and try again."
    );
    return;
  }

  try {
    // Clear previous data
    tableHeader.innerHTML = "";
    tableBody.innerHTML = "";

    // Update the table container structure
    const tableResponsive = document.querySelector(".table-responsive");

    // Check if tableResponsive exists before modifying it
    if (!tableResponsive) {
      console.error("Table responsive container not found");
      showErrorMessage(
        "Error: Could not find table container. Please refresh the page and try again."
      );
      return;
    }

    tableResponsive.className = "data-table-container";
    tableResponsive.innerHTML = `
            <div class="data-table-scroll">
                <table class="table" id="data-table">
                    <thead>
                        <tr id="table-header"></tr>
                    </thead>
                    <tbody id="table-body"></tbody>
                </table>
            </div>
            <div class="table-footer" id="table-footer" style="display: none;"></div>
        `;

    // Get references to the new elements
    const newTableHeader = document.getElementById("table-header");
    const newTableBody = document.getElementById("table-body");
    const tableFooter = document.getElementById("table-footer");

    // Check if the new elements were created successfully
    if (!newTableHeader || !newTableBody) {
      console.error("Failed to create new table elements");
      showErrorMessage(
        "Error: Failed to create table. Please refresh the page and try again."
      );
      return;
    }

    // Calculate daily changes if we have Open and Close columns
    let hasChangeColumn = false;
    if (columns.includes("Close") && columns.includes("Open")) {
      data.forEach((row, index) => {
        if (index > 0) {
          const prevClose = data[index - 1].Close;
          row.Change = (((row.Close - prevClose) / prevClose) * 100).toFixed(2);
        } else {
          row.Change = (((row.Close - row.Open) / row.Open) * 100).toFixed(2);
        }
      });

      // Add Change column to columns array if not already there
      if (!columns.includes("Change")) {
        columns.push("Change");
      }
      hasChangeColumn = true;
    }

    // Enhance data info with additional details and actions
    const startDate = new Date(startDateInput.value).toLocaleDateString();
    const endDate = new Date(endDateInput.value).toLocaleDateString();
    dataInfo.innerHTML = `
            <div>
                <i class="fas fa-info-circle me-2"></i>
                Data for <strong class="current-company-info">${currentCompany}</strong>
                <span class="data-count-badge">${data.length} rows</span>
                <span class="data-source-badge">Source: ${source}</span>
                <br>
                <small class="text-muted">Period: ${startDate} to ${endDate}</small>
            </div>
            <div class="data-actions">
                <button class="btn btn-sm btn-outline-primary" id="toggle-all-data">
                    <i class="fas fa-expand-alt me-1"></i>Show All
                </button>
            </div>
        `;

    // Add event listener for show all button
    const toggleAllDataBtn = document.getElementById("toggle-all-data");
    if (toggleAllDataBtn) {
      toggleAllDataBtn.addEventListener("click", function () {
        const dataTable = document.querySelector(".data-table-scroll");
        if (dataTable) {
          if (dataTable.style.maxHeight === "none") {
            dataTable.style.maxHeight = "400px";
            this.innerHTML = '<i class="fas fa-expand-alt me-1"></i>Show All';
          } else {
            dataTable.style.maxHeight = "none";
            this.innerHTML =
              '<i class="fas fa-compress-alt me-1"></i>Show Less';
          }
        }
      });
    }

    // Create table header with enhanced styling
    columns.forEach((column) => {
      const th = document.createElement("th");
      // Add sort icon if needed
      th.innerHTML = `${column} <i class="fas fa-sort text-white-50"></i>`;
      newTableHeader.appendChild(th);
    });

    // Determine which column is the price column for highlighting
    const priceColumnIndex =
      columns.indexOf("Close") !== -1
        ? columns.indexOf("Close")
        : columns.indexOf("Adj Close") !== -1
        ? columns.indexOf("Adj Close")
        : -1;

    // Display all data rows with enhanced format
    data.forEach((row, rowIndex) => {
      const tr = document.createElement("tr");

      columns.forEach((column, colIndex) => {
        const td = document.createElement("td");

        // Apply special formatting based on column type
        if (column === "Date") {
          // Format date - add try-catch for safer date parsing
          try {
            const date = new Date(row[column]);
            if (!isNaN(date.getTime())) {
              td.textContent = date.toLocaleDateString();
            } else {
              td.textContent = row[column] || "Invalid Date";
            }
          } catch (e) {
            console.error("Error formatting date:", e);
            td.textContent = row[column] || "Error";
          }
        } else if (column === "Change") {
          // Format percent change with icons
          const change = parseFloat(row[column]);
          const changeValue = Math.abs(change).toFixed(2) + "%";
          const icon =
            change >= 0
              ? '<i class="fas fa-caret-up me-1"></i>'
              : '<i class="fas fa-caret-down me-1"></i>';
          td.innerHTML = icon + changeValue;
          td.className = change >= 0 ? "positive-change" : "negative-change";
        } else {
          // Format numeric values with proper decimal places
          if (typeof row[column] === "number") {
            td.textContent = row[column].toFixed(2);

            // Highlight price column
            if (colIndex === priceColumnIndex) {
              td.className = "price-column";
            }
          } else {
            td.textContent = row[column] || "";
          }
        }

        tr.appendChild(td);
      });

      newTableBody.appendChild(tr);
    });

    // Add "show more" footer if more than 50 rows
    if (tableFooter && data.length > 50) {
      tableFooter.innerHTML = `Showing 50 of ${data.length} rows. Use the "Show All" button to display all data.`;
      tableFooter.style.display = "block";
    }
  } catch (error) {
    console.error("Error displaying stock data:", error);
    showErrorMessage("Error displaying data: " + error.message);
  }
}

// Create stock price plot
function createStockPlot(data, columns) {
  console.log("Creating stock plot");

  // Validate inputs
  if (!data || data.length === 0 || !columns || columns.length === 0) {
    console.error("Invalid data or columns provided to createStockPlot");
    showErrorMessage("Error creating stock plot: Invalid data provided");
    return;
  }

  try {
    // Get plot element and check if it exists
    const plotDiv = document.getElementById("stock-plot");
    if (!plotDiv) {
      console.error("Plot div element not found");
      return;
    }

    // Clear any existing plot
    while (plotDiv.firstChild) {
      plotDiv.removeChild(plotDiv.firstChild);
    }

    // Ensure we have date and price columns
    if (!data[0].Date || !data[0].Close) {
      console.error("Data missing required Date or Close columns");
      showErrorMessage(
        "Error creating stock plot: Missing required data columns"
      );
      return;
    }

    // Format dates
    const dates = data.map((row) => new Date(row.Date));

    // Create traces for different columns
    const traces = [];

    // Always show Close price
    traces.push({
      name: "Close",
      x: dates,
      y: data.map((row) => row.Close),
      type: "scatter",
      mode: "lines",
      line: { color: "#4d9aff", width: 2 },
    });

    // Add Open, High, Low and Volume if they exist
    const additionalColumns = ["Open", "High", "Low", "Volume"];
    const colors = ["#28a745", "#9932CC", "#dc3545", "#ff9900"];

    additionalColumns.forEach((col, index) => {
      if (columns.includes(col) && data[0][col] !== undefined) {
        let showByDefault = col === "Close"; // Only show Close by default

        traces.push({
          name: col,
          x: dates,
          y: data.map((row) => row[col]),
          type: "scatter",
          mode: col === "Volume" ? "lines" : "lines",
          line: { color: colors[index], width: 1.5 },
          visible: showByDefault ? true : "legendonly", // Hide all except 'Close' by default
          yaxis: col === "Volume" ? "y2" : "y", // Use secondary y-axis for Volume
        });
      }
    });

    // Get theme
    const currentTheme =
      document.documentElement.getAttribute("data-theme") || "light";
    const bgColor = currentTheme === "dark" ? "#1e1e1e" : "#ffffff";
    const gridColor = currentTheme === "dark" ? "#333333" : "#eeeeee";
    const textColor = currentTheme === "dark" ? "#f0f0f0" : "#333333";

    // Create a second y-axis for volume if it exists
    const hasVolume =
      columns.includes("Volume") && data[0].Volume !== undefined;

    // Plot layout
    const layout = {
      title: "Stock Price History",
      autosize: true,
      height: 500,
      margin: { l: 50, r: 50, b: 50, t: 50, pad: 4 },
      paper_bgcolor: bgColor,
      plot_bgcolor: bgColor,
      font: { color: textColor },
      xaxis: {
        title: "Date",
        showgrid: true,
        gridcolor: gridColor,
        showline: true,
        linecolor: gridColor,
      },
      yaxis: {
        title: "Price",
        showgrid: true,
        gridcolor: gridColor,
        zeroline: true,
        zerolinecolor: gridColor,
      },
      legend: {
        orientation: "h",
        y: -0.2,
      },
      hovermode: "x unified",
    };

    // Add second y-axis for volume if it exists
    if (hasVolume) {
      layout.yaxis2 = {
        title: "Volume",
        showgrid: false,
        showline: true,
        linecolor: colors[3],
        side: "right",
        overlaying: "y",
      };
    }

    // Create config for plot
    const config = {
      responsive: true,
      displayModeBar: true,
      modeBarButtonsToRemove: ["lasso2d", "select2d"],
      displaylogo: false,
    };

    // Create plot
    Plotly.newPlot("stock-plot", traces, layout, config);

    // Add event listener to resize plot when window size changes
    window.addEventListener("resize", function () {
      Plotly.relayout("stock-plot", {
        autosize: true,
      });
    });

    console.log("Stock plot created successfully");
  } catch (error) {
    console.error("Error creating stock plot:", error);
    showErrorMessage("Error creating plot. Please try again.");
  }
}

// Populate column select dropdown
function populateColumnSelect(columns) {
  const columnSelect = document.getElementById("column-select");

  // Clear previous options
  columnSelect.innerHTML = "";

  // Add options for each column except Date
  for (let i = 1; i < columns.length; i++) {
    const option = document.createElement("option");
    option.value = columns[i];
    option.textContent = columns[i];
    columnSelect.appendChild(option);
  }

  // Set default selected column
  if (columns.length > 1) {
    selectedColumn = columns[1];
    columnSelect.value = selectedColumn;
  }

  // Add event listener for column selection
  columnSelect.addEventListener("change", function () {
    selectedColumn = this.value;
    checkStationarity();
    createDecomposition();
  });

  // Trigger initial checks
  checkStationarity();
  createDecomposition();
}

// Check data stationarity
async function checkStationarity() {
  if (!selectedColumn || stockData.length === 0) return;

  const stationaritySection = document.getElementById("stationarity-section");
  stationaritySection.style.display = "block";
  showSectionLoading("stationarity-section", "Checking stationarity...");

  try {
    const response = await fetch("/api/stationarity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        column_data: stockData.map((row) => row[selectedColumn]),
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to check stationarity");
    }

    const result = await response.json();

    // Display stationarity result
    const stationarityResult = document.getElementById("stationarity-result");

    if (result.is_stationary) {
      stationarityResult.textContent =
        "Yes, the data is stationary (p-value < 0.05)";
      stationarityResult.className = "alert alert-success";
    } else {
      stationarityResult.textContent =
        "No, the data is not stationary (p-value >= 0.05)";
      stationarityResult.className = "alert alert-warning";
    }
  } catch (error) {
    console.error("Error checking stationarity:", error);
    showErrorMessage("Error checking stationarity: " + error.message);
  } finally {
    hideSectionLoading("stationarity-section");
  }
}

// Create decomposition plots
async function createDecomposition() {
  if (!selectedColumn || stockData.length === 0) return;

  const decompositionSection = document.getElementById("decomposition-section");
  decompositionSection.style.display = "block";
  showSectionLoading(
    "decomposition-section",
    "Creating time series decomposition..."
  );

  try {
    const response = await fetch("/api/decomposition", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        column_data: stockData.map((row) => row[selectedColumn]),
        dates: stockData.map((row) => row.Date),
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create decomposition");
    }

    const result = await response.json();

    Plotly.newPlot("trend-plot", JSON.parse(result.trend));
    Plotly.newPlot("seasonal-plot", JSON.parse(result.seasonal));
    Plotly.newPlot("residual-plot", JSON.parse(result.resid));

    // After decomposition, run the selected model
    runSelectedModel();
  } catch (error) {
    console.error("Error creating decomposition:", error);
    showErrorMessage("Error creating decomposition: " + error.message);
  } finally {
    hideSectionLoading("decomposition-section");
  }
}

// Run the selected model
async function runSelectedModel() {
  if (!selectedColumn || stockData.length === 0) {
    console.error("No data or column selected");
    showErrorMessage(
      "Error: No data available or column not selected. Please fetch data first."
    );
    return;
  }

  const modelType = modelSelect.value;
  const modelSection = document.getElementById("model-section");

  if (!modelSection) {
    console.error("Model section not found");
    showErrorMessage(
      "Error: Model section not found. Please refresh the page and try again."
    );
    return;
  }

  console.log(
    `Running ${modelType} model for ${selectedColumn} with ${stockData.length} data points`
  );

  modelSection.style.display = "block";
  const modelTitleElement = document.getElementById("model-title");
  if (modelTitleElement) {
    modelTitleElement.innerHTML = `<i class="fas fa-brain me-2"></i>${modelType} Model Results for ${currentCompany}`;
  }

  // Set metrics section and components plot display based on model
  const metricsSection = document.getElementById("metrics-section");
  const componentsPlot = document.getElementById("components-plot");

  if (!metricsSection || !componentsPlot) {
    console.error("Metrics section or components plot not found");
    showErrorMessage(
      "Error: UI elements not found. Please refresh the page and try again."
    );
    return;
  }

  metricsSection.style.display = modelType === "Prophet" ? "none" : "flex";
  componentsPlot.style.display = modelType === "Prophet" ? "block" : "none";

  // Show advanced loading animation
  showModelLoading(`Preparing ${modelType} model for ${currentCompany}...`);

  try {
    let endpoint = "";
    let payload = {};

    switch (modelType) {
      case "Transformer":
        endpoint = "/api/transformer";
        // Get Transformer parameters
        const sequence_length_elem = document.getElementById("sequence-length");
        const head_size_elem = document.getElementById("head-size");
        const num_heads_elem = document.getElementById("num-heads");

        if (!sequence_length_elem || !head_size_elem || !num_heads_elem) {
          throw new Error("Transformer parameters not found");
        }

        const sequence_length = parseInt(sequence_length_elem.value);
        const head_size = parseInt(head_size_elem.value);
        const num_heads = parseInt(num_heads_elem.value);

        console.log(
          `Transformer params: seq_len=${sequence_length}, head_size=${head_size}, num_heads=${num_heads}`
        );

        payload = {
          data: stockData,
          column: selectedColumn,
          sequence_length: sequence_length,
          head_size: head_size,
          num_heads: num_heads,
        };
        break;

      case "LSTM":
        endpoint = "/api/lstm";
        const seqLength = parseInt(seqLengthSlider.value);
        console.log(`LSTM params: seq_length=${seqLength}`);

        payload = {
          data: stockData,
          column: selectedColumn,
          seq_length: seqLength,
        };
        break;

      case "Prophet":
        endpoint = "/api/prophet";
        payload = {
          data: stockData,
          column: selectedColumn,
        };
        break;

      default:
        throw new Error("Unknown model type");
    }

    console.log(
      `Sending request to ${endpoint} with payload for ${selectedColumn}`
    );

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error: ${response.status} - ${errorText}`);
      throw new Error(
        `Failed to run ${modelType} model: ${response.status} ${response.statusText}`
      );
    }

    // Update progress to 100% before completing
    updateModelProgress(100, "Finalizing results...");

    // Add small delay before showing results for better UX
    setTimeout(async () => {
      try {
        const result = await response.json();
        console.log(`Received model results:`, result);

        if (result.error) {
          throw new Error(result.error);
        }

        // Process results based on model type
        if (modelType === "Prophet") {
          displayProphetResults(result);
        } else {
          displayModelResults(result, modelType);
        }

        // Hide loading animation
        hideModelLoading();

        // Scroll to model section
        modelSection.scrollIntoView({
          behavior: "smooth",
        });
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError);
        showErrorMessage(
          `Error processing ${modelType} model response: ${parseError.message}`
        );
        hideModelLoading();
      }
    }, 800);
  } catch (error) {
    console.error(`Error running ${modelType} model:`, error);
    showErrorMessage(`Error running ${modelType} model: ${error.message}`);
    hideModelLoading();
  }
}

// Display model results (XGBoost and LSTM)
function displayModelResults(result, modelType) {
  console.log(`Displaying ${modelType} model results`);

  // Check if result contains metrics and required data
  if (
    !result ||
    !result.metrics ||
    !result.predictions ||
    !result.future_predictions
  ) {
    console.error("Invalid model results", result);
    showErrorMessage(
      `Error: Received invalid ${modelType} model results from server`
    );
    return;
  }

  // Get DOM elements with null checks
  const maeValue = document.getElementById("mae-value");
  const mseValue = document.getElementById("mse-value");
  const rmseValue = document.getElementById("rmse-value");
  const r2Value = document.getElementById("r2-value");
  const predictionPlot = document.getElementById("prediction-plot");

  if (!maeValue || !mseValue || !rmseValue || !r2Value || !predictionPlot) {
    console.error("Missing DOM elements for displaying model results");
    showErrorMessage("Error: UI elements for model results not found");
    return;
  }

  // Display metrics
  maeValue.textContent = result.metrics.mae.toFixed(2);
  mseValue.textContent = result.metrics.mse.toFixed(2);
  rmseValue.textContent = result.metrics.rmse.toFixed(2);
  r2Value.textContent = result.metrics.r2.toFixed(4);

  // Create prediction plot
  const allDates = stockData.map((row) => new Date(row.Date));
  const testDates = result.test_dates.map((date) => new Date(date));
  const futureDates = result.future_dates.map((date) => new Date(date));

  const traces = [
    {
      x: allDates,
      y: stockData.map((row) => row[selectedColumn]),
      type: "scatter",
      mode: "lines",
      name: "Actual",
      line: { color: "#4D9AFF", width: 2 },
    },
    {
      x: testDates,
      y: result.predictions,
      type: "scatter",
      mode: "lines",
      name: "Predicted",
      line: { color: "#dc3545", width: 2 },
    },
    {
      x: futureDates,
      y: result.future_predictions,
      type: "scatter",
      mode: "lines+markers",
      name: "Future Prediction (3 Days)",
      line: { color: "#28a745", width: 3, dash: "dash" },
      marker: { size: 8, symbol: "circle" },
    },
  ];

  // Create annotations for future predictions
  const annotations = [];
  for (let i = 0; i < futureDates.length; i++) {
    const date = futureDates[i];
    const value = result.future_predictions[i];
    const formattedDate = date.toLocaleDateString();

    annotations.push({
      x: date,
      y: value,
      xref: "x",
      yref: "y",
      text: `<b>Day ${i + 1}</b><br>${formattedDate}<br>$${value.toFixed(2)}`,
      showarrow: true,
      arrowhead: 2,
      arrowsize: 1,
      arrowwidth: 2,
      arrowcolor: "#28a745",
      ax: -40,
      ay: -40,
      bordercolor: "#28a745",
      borderwidth: 2,
      borderpad: 4,
      bgcolor: "rgba(255, 255, 255, 0.8)",
      font: { size: 10 },
    });
  }

  // Add summary box for future predictions
  const lastPrice = stockData.map((row) => row[selectedColumn])[
    stockData.length - 1
  ];
  const futurePredictions = result.future_predictions;
  const changePercents = futurePredictions.map((val) =>
    (((val - lastPrice) / lastPrice) * 100).toFixed(2)
  );

  // Add prediction summary annotation
  annotations.push({
    x: allDates[allDates.length - 1],
    y: lastPrice,
    xref: "x",
    yref: "y",
    text:
      `<b>3-Day Forecast Summary</b><br>` +
      `Day 1: ${changePercents[0]}%<br>` +
      `Day 2: ${changePercents[1]}%<br>` +
      `Day 3: ${changePercents[2]}%<br>` +
      `<i>Relative to last known price</i>`,
    showarrow: true,
    arrowhead: 0,
    arrowsize: 1,
    arrowwidth: 2,
    arrowcolor: "#6c757d",
    ax: -80,
    ay: -80,
    bordercolor: "#6c757d",
    borderwidth: 2,
    borderpad: 4,
    bgcolor: "rgba(255, 255, 255, 0.9)",
    font: { size: 12 },
  });

  const layout = {
    title: `${modelType} Model: Actual vs Predicted Prices for ${selectedColumn}`,
    xaxis: { title: "Date" },
    yaxis: { title: "Price" },
    height: 500,
    showlegend: true,
    legend: {
      orientation: "h",
      y: -0.2,
    },
    template: "plotly_white",
    annotations: annotations,
    shapes: [
      {
        type: "line",
        x0: allDates[allDates.length - 1],
        y0: lastPrice * 0.9,
        x1: allDates[allDates.length - 1],
        y1: lastPrice * 1.1,
        line: {
          color: "gray",
          width: 1,
          dash: "dash",
        },
      },
    ],
  };

  try {
    Plotly.newPlot(predictionPlot, traces, layout);

    // Add extra information about the 3-day prediction below the chart
    const predictionInfo = document.createElement("div");
    predictionInfo.className = "alert alert-info mt-3";
    predictionInfo.innerHTML = `
            <h5><i class="fas fa-info-circle me-2"></i>3-Day Price Prediction Details</h5>
            <div class="row">
                <div class="col-md-4">
                    <div class="prediction-day">
                        <h6>Day 1 (${futureDates[0].toLocaleDateString()})</h6>
                        <p class="prediction-value">$${futurePredictions[0].toFixed(
                          2
                        )}</p>
                        <p class="prediction-change ${
                          changePercents[0] >= 0
                            ? "text-success"
                            : "text-danger"
                        }">
                            <i class="fas fa-${
                              changePercents[0] >= 0 ? "arrow-up" : "arrow-down"
                            }"></i> 
                            ${Math.abs(changePercents[0])}%
                        </p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="prediction-day">
                        <h6>Day 2 (${futureDates[1].toLocaleDateString()})</h6>
                        <p class="prediction-value">$${futurePredictions[1].toFixed(
                          2
                        )}</p>
                        <p class="prediction-change ${
                          changePercents[1] >= 0
                            ? "text-success"
                            : "text-danger"
                        }">
                            <i class="fas fa-${
                              changePercents[1] >= 0 ? "arrow-up" : "arrow-down"
                            }"></i> 
                            ${Math.abs(changePercents[1])}%
                        </p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="prediction-day">
                        <h6>Day 3 (${futureDates[2].toLocaleDateString()})</h6>
                        <p class="prediction-value">$${futurePredictions[2].toFixed(
                          2
                        )}</p>
                        <p class="prediction-change ${
                          changePercents[2] >= 0
                            ? "text-success"
                            : "text-danger"
                        }">
                            <i class="fas fa-${
                              changePercents[2] >= 0 ? "arrow-up" : "arrow-down"
                            }"></i> 
                            ${Math.abs(changePercents[2])}%
                        </p>
                    </div>
                </div>
            </div>
            <p class="mt-2 small text-muted">These predictions are based on historical patterns and technical analysis. Market conditions can change rapidly.</p>
        `;

    // Check if prediction info already exists and remove it
    const existingInfo = document.querySelector(".alert.alert-info.mt-3");
    if (existingInfo) {
      existingInfo.remove();
    }

    // Add the new prediction info after the plot
    if (predictionPlot.nextElementSibling) {
      predictionPlot.parentNode.insertBefore(
        predictionInfo,
        predictionPlot.nextElementSibling
      );
    } else {
      predictionPlot.parentNode.appendChild(predictionInfo);
    }

    console.log(`${modelType} model results displayed successfully`);
  } catch (error) {
    console.error("Error creating plot:", error);
    showErrorMessage(`Error creating ${modelType} plot: ${error.message}`);
  }
}

// Display Prophet model results
function displayProphetResults(result) {
  console.log("Displaying Prophet model results");

  // Check if result contains required data
  if (!result || !result.forecast || !result.components) {
    console.error("Invalid Prophet model results", result);
    showErrorMessage(
      "Error: Received invalid Prophet model results from server"
    );
    return;
  }

  // Get DOM elements with null checks
  const predictionPlot = document.getElementById("prediction-plot");
  const componentsPlot = document.getElementById("components-plot");

  if (!predictionPlot || !componentsPlot) {
    console.error("Missing DOM elements for displaying Prophet results");
    showErrorMessage("Error: UI elements for Prophet results not found");
    return;
  }

  try {
    // Create forecast plot
    const forecast = result.forecast;

    const traces = [
      {
        x: stockData.map((row) => new Date(row.Date)),
        y: stockData.map((row) => row[selectedColumn]),
        type: "scatter",
        mode: "lines",
        name: "Historical",
        line: { color: "#4D9AFF", width: 2 },
      },
      {
        x: forecast.ds.map((date) => new Date(date)),
        y: forecast.yhat,
        type: "scatter",
        mode: "lines",
        name: "Forecast",
        line: { color: "#dc3545", width: 2 },
      },
      {
        x: forecast.ds.map((date) => new Date(date)),
        y: forecast.yhat_upper,
        type: "scatter",
        mode: "lines",
        name: "Upper Bound",
        line: { color: "rgba(220, 53, 69, 0.3)", width: 1 },
        fill: "tonexty",
        fillcolor: "rgba(220, 53, 69, 0.1)",
      },
      {
        x: forecast.ds.map((date) => new Date(date)),
        y: forecast.yhat_lower,
        type: "scatter",
        mode: "lines",
        name: "Lower Bound",
        line: { color: "rgba(220, 53, 69, 0.3)", width: 1 },
        fill: "tonexty",
        fillcolor: "rgba(220, 53, 69, 0.1)",
      },
    ];

    // Extract the last known historical price
    const lastPrice = stockData.map((row) => row[selectedColumn])[
      stockData.length - 1
    ];

    // Extract 3-day forecast
    const threeDayForecast = {
      dates: forecast.ds.slice(0, 3).map((date) => new Date(date)),
      values: forecast.yhat.slice(0, 3),
      upper: forecast.yhat_upper.slice(0, 3),
      lower: forecast.yhat_lower.slice(0, 3),
    };

    // Create annotations for the forecast points
    const annotations = [];
    for (let i = 0; i < 3; i++) {
      const date = threeDayForecast.dates[i];
      const value = threeDayForecast.values[i];
      const formattedDate = date.toLocaleDateString();

      annotations.push({
        x: date,
        y: value,
        xref: "x",
        yref: "y",
        text: `<b>Day ${i + 1}</b><br>${formattedDate}<br>$${value.toFixed(2)}`,
        showarrow: true,
        arrowhead: 2,
        arrowsize: 1,
        arrowwidth: 2,
        arrowcolor: "#dc3545",
        ax: -40,
        ay: -40,
        bordercolor: "#dc3545",
        borderwidth: 2,
        borderpad: 4,
        bgcolor: "rgba(255, 255, 255, 0.8)",
        font: { size: 10 },
      });
    }

    // Calculate percent changes
    const changePercents = threeDayForecast.values.map((val) =>
      (((val - lastPrice) / lastPrice) * 100).toFixed(2)
    );

    // Add summary annotation
    annotations.push({
      x: stockData.map((row) => new Date(row.Date))[stockData.length - 1],
      y: lastPrice,
      xref: "x",
      yref: "y",
      text:
        `<b>3-Day Forecast Summary</b><br>` +
        `Day 1: ${changePercents[0]}%<br>` +
        `Day 2: ${changePercents[1]}%<br>` +
        `Day 3: ${changePercents[2]}%<br>` +
        `<i>Relative to last known price</i>`,
      showarrow: true,
      arrowhead: 0,
      arrowsize: 1,
      arrowwidth: 2,
      arrowcolor: "#6c757d",
      ax: -80,
      ay: -80,
      bordercolor: "#6c757d",
      borderwidth: 2,
      borderpad: 4,
      bgcolor: "rgba(255, 255, 255, 0.9)",
      font: { size: 12 },
    });

    const layout = {
      title: `Prophet Model: Forecast for ${selectedColumn}`,
      xaxis: { title: "Date" },
      yaxis: { title: "Price" },
      height: 500,
      showlegend: true,
      legend: {
        orientation: "h",
        y: -0.2,
      },
      template: "plotly_white",
      annotations: annotations,
      shapes: [
        {
          type: "line",
          x0: stockData.map((row) => new Date(row.Date))[stockData.length - 1],
          y0: lastPrice * 0.9,
          x1: stockData.map((row) => new Date(row.Date))[stockData.length - 1],
          y1: lastPrice * 1.1,
          line: {
            color: "gray",
            width: 1,
            dash: "dash",
          },
        },
      ],
    };

    Plotly.newPlot(predictionPlot, traces, layout);

    // Add additional prediction info below the plot
    const predictionInfo = document.createElement("div");
    predictionInfo.className = "alert alert-info mt-3";
    predictionInfo.innerHTML = `
            <h5><i class="fas fa-info-circle me-2"></i>3-Day Forecast Details (Prophet Model)</h5>
            <div class="row">
                <div class="col-md-4">
                    <div class="prediction-day">
                        <h6>Day 1 (${threeDayForecast.dates[0].toLocaleDateString()})</h6>
                        <p class="prediction-value">$${threeDayForecast.values[0].toFixed(
                          2
                        )}</p>
                        <p class="prediction-change ${
                          changePercents[0] >= 0
                            ? "text-success"
                            : "text-danger"
                        }">
                            <i class="fas fa-${
                              changePercents[0] >= 0 ? "arrow-up" : "arrow-down"
                            }"></i> 
                            ${Math.abs(changePercents[0])}%
                        </p>
                        <p class="small">
                            <span class="text-muted">Range:</span> 
                            $${threeDayForecast.lower[0].toFixed(
                              2
                            )} - $${threeDayForecast.upper[0].toFixed(2)}
                        </p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="prediction-day">
                        <h6>Day 2 (${threeDayForecast.dates[1].toLocaleDateString()})</h6>
                        <p class="prediction-value">$${threeDayForecast.values[1].toFixed(
                          2
                        )}</p>
                        <p class="prediction-change ${
                          changePercents[1] >= 0
                            ? "text-success"
                            : "text-danger"
                        }">
                            <i class="fas fa-${
                              changePercents[1] >= 0 ? "arrow-up" : "arrow-down"
                            }"></i> 
                            ${Math.abs(changePercents[1])}%
                        </p>
                        <p class="small">
                            <span class="text-muted">Range:</span> 
                            $${threeDayForecast.lower[1].toFixed(
                              2
                            )} - $${threeDayForecast.upper[1].toFixed(2)}
                        </p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="prediction-day">
                        <h6>Day 3 (${threeDayForecast.dates[2].toLocaleDateString()})</h6>
                        <p class="prediction-value">$${threeDayForecast.values[2].toFixed(
                          2
                        )}</p>
                        <p class="prediction-change ${
                          changePercents[2] >= 0
                            ? "text-success"
                            : "text-danger"
                        }">
                            <i class="fas fa-${
                              changePercents[2] >= 0 ? "arrow-up" : "arrow-down"
                            }"></i> 
                            ${Math.abs(changePercents[2])}%
                        </p>
                        <p class="small">
                            <span class="text-muted">Range:</span> 
                            $${threeDayForecast.lower[2].toFixed(
                              2
                            )} - $${threeDayForecast.upper[2].toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>
            <p class="mt-2 small text-muted">Prophet provides confidence intervals (upper and lower bounds) to show the range of possible future values. The wider the range, the more uncertainty.</p>
        `;

    // Check if prediction info already exists and remove it
    const existingInfo = document.querySelector(".alert.alert-info.mt-3");
    if (existingInfo) {
      existingInfo.remove();
    }

    // Add the new prediction info after the plot
    if (predictionPlot.nextElementSibling) {
      predictionPlot.parentNode.insertBefore(
        predictionInfo,
        predictionPlot.nextElementSibling
      );
    } else {
      predictionPlot.parentNode.appendChild(predictionInfo);
    }

    // Create components plot if we have the components
    if (result.components && componentsPlot) {
      const trendTrace = {
        x: result.components.dates.map((date) => new Date(date)),
        y: result.components.trend,
        type: "scatter",
        mode: "lines",
        name: "Trend",
        line: { color: "#4D9AFF", width: 2 },
      };

      const componentLayout = {
        title: "Trend Component",
        xaxis: { title: "Date" },
        yaxis: { title: "Trend" },
        height: 300,
        template: "plotly_white",
      };

      Plotly.newPlot(componentsPlot, [trendTrace], componentLayout);
    }

    console.log("Prophet model results displayed successfully");
  } catch (error) {
    console.error("Error displaying Prophet results:", error);
    showErrorMessage("Error creating Prophet plots: " + error.message);
  }
}

// Function to set up video background and handle errors
function setupVideoBackground() {
  const videoBackground = document.querySelector(".video-background");
  const video = document.getElementById("bg-video");
  const animatedBg = document.querySelector(".animated-bg");

  if (video && videoBackground) {
    // Try to load the video
    video.oncanplaythrough = function () {
      console.log("Video loaded successfully");
      videoBackground.style.display = "block";
      animatedBg.style.opacity = "0";
    };

    // Handle video load errors
    video.onerror = function (e) {
      console.error("Video loading error:", e);
      useAnimatedBackground();
    };

    // Ensure video starts playing
    video.play().catch(function (error) {
      console.error("Video play error:", error);
      // Some browsers require user interaction before playing video
      // In this case, we'll just show the video anyway and it will start when allowed
    });

    // Sometimes oncanplaythrough doesn't fire, so we'll check if the video is playing after a delay
    setTimeout(function () {
      if (video.readyState < 3) {
        console.log("Video not ready after timeout");
        // Don't use animated background here, just give more time for the video to load
        // since we know the file exists locally

        // Try playing again after a delay
        setTimeout(function () {
          video.load(); // Reload the video
          video.play().catch(function (error) {
            console.error("Second attempt video play error:", error);
          });
        }, 1000);
      }
    }, 2000);

    // Function to adjust video size based on screen size
    function adjustVideoSize() {
      // Calculate the aspect ratio
      const aspectRatio = 16 / 9; // Assuming 16:9 aspect ratio for the video

      if (window.innerWidth / window.innerHeight < aspectRatio) {
        // If the window is narrower than the video aspect ratio
        video.style.width = "100%";
        video.style.height = "auto";
      } else {
        // If the window is wider than the video aspect ratio
        video.style.width = "auto";
        video.style.height = "100%";
      }
    }

    // Adjust on load and resize
    adjustVideoSize();
    window.addEventListener("resize", adjustVideoSize);
  } else {
    useAnimatedBackground();
  }

  // Function to fallback to animated background
  function useAnimatedBackground() {
    console.log("Using animated background");
    if (videoBackground) videoBackground.style.display = "none";
    if (animatedBg) animatedBg.style.opacity = "1";
  }
}

// Apply technical indicators to the chart
function applyTechnicalIndicators() {
  if (!stockData || stockData.length === 0 || !selectedColumn) {
    showErrorMessage("No data available for technical analysis");
    return;
  }

  // Show loading spinner
  showSectionLoading("viz-section", "Calculating indicators...");

  // Get indicator preferences
  const showMA = document.getElementById("show-ma").checked;
  const maPeriod = parseInt(document.getElementById("ma-period").value);

  const showBollinger = document.getElementById("show-bollinger").checked;
  const bollingerPeriod = parseInt(
    document.getElementById("bollinger-period").value
  );

  const showRSI = document.getElementById("show-rsi").checked;
  const rsiPeriod = parseInt(document.getElementById("rsi-period").value);

  // Update main chart with indicators
  setTimeout(() => {
    updateChartWithIndicators(showMA, maPeriod, showBollinger, bollingerPeriod);

    // Calculate and display RSI if selected
    if (showRSI) {
      calculateRSI(rsiPeriod);
      // Show indicators section
      document.getElementById("indicators-section").style.display = "block";
    }

    // Calculate and display volume analysis
    createVolumeChart();

    // Calculate support and resistance levels
    calculateSupportResistance();

    // Create technical summary
    createTechnicalSummary(rsiPeriod);

    hideSectionLoading("viz-section");
  }, 500);
}

// Calculate moving average
function calculateMA(data, period) {
  const result = [];

  // Initial null values for the first (period-1) elements
  for (let i = 0; i < period - 1; i++) {
    result.push(null);
  }

  // Calculate MA for remaining elements
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j];
    }
    result.push(sum / period);
  }

  return result;
}

// Calculate Bollinger Bands
function calculateBollingerBands(data, period, numStdDev = 2) {
  const ma = calculateMA(data, period);
  const upper = [];
  const lower = [];

  // Initial null values
  for (let i = 0; i < period - 1; i++) {
    upper.push(null);
    lower.push(null);
  }

  // Calculate standard deviation and bands
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += Math.pow(data[i - j] - ma[i], 2);
    }
    const stdDev = Math.sqrt(sum / period);

    upper.push(ma[i] + numStdDev * stdDev);
    lower.push(ma[i] - numStdDev * stdDev);
  }

  return { ma, upper, lower };
}

// Calculate RSI (Relative Strength Index)
function calculateRSI(period) {
  const prices = stockData.map((row) => row[selectedColumn]);
  const gains = [];
  const losses = [];

  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  // Calculate average gains and losses
  const avgGains = [];
  const avgLosses = [];

  // Initial average
  let gainSum = 0;
  let lossSum = 0;

  for (let i = 0; i < period; i++) {
    gainSum += gains[i];
    lossSum += losses[i];
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;

  avgGains.push(avgGain);
  avgLosses.push(avgLoss);

  // Calculate subsequent averages using smoothing
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

    avgGains.push(avgGain);
    avgLosses.push(avgLoss);
  }

  // Calculate RS and RSI
  const rsi = [];

  // Initial null values
  for (let i = 0; i < period; i++) {
    rsi.push(null);
  }

  for (let i = 0; i < avgGains.length; i++) {
    const rs = avgGains[i] / (avgLosses[i] === 0 ? 0.001 : avgLosses[i]); // Avoid division by zero
    rsi.push(100 - 100 / (1 + rs));
  }

  // Create RSI plot
  const dates = stockData.map((row) => new Date(row.Date));

  const trace = {
    x: dates,
    y: rsi,
    type: "scatter",
    mode: "lines",
    line: { color: "#4D9AFF", width: 2 },
    name: `RSI (${period})`,
  };

  const layout = {
    title: `Relative Strength Index (${period})`,
    height: 300,
    margin: { l: 40, r: 40, t: 40, b: 40 },
    xaxis: { title: "Date" },
    yaxis: {
      title: "RSI",
      range: [0, 100],
    },
    shapes: [
      {
        type: "line",
        x0: dates[0],
        y0: 70,
        x1: dates[dates.length - 1],
        y1: 70,
        line: {
          color: "rgba(220, 53, 69, 0.5)",
          width: 1,
          dash: "dash",
        },
      },
      {
        type: "line",
        x0: dates[0],
        y0: 30,
        x1: dates[dates.length - 1],
        y1: 30,
        line: {
          color: "rgba(40, 167, 69, 0.5)",
          width: 1,
          dash: "dash",
        },
      },
      {
        type: "rect",
        x0: dates[0],
        y0: 70,
        x1: dates[dates.length - 1],
        y1: 100,
        fillcolor: "rgba(220, 53, 69, 0.1)",
        line: { width: 0 },
      },
      {
        type: "rect",
        x0: dates[0],
        y0: 0,
        x1: dates[dates.length - 1],
        y1: 30,
        fillcolor: "rgba(40, 167, 69, 0.1)",
        line: { width: 0 },
      },
    ],
  };

  Plotly.newPlot("rsi-plot", [trace], layout);

  // Update RSI value in technical summary
  const lastRSI = rsi[rsi.length - 1];
  document.getElementById("rsi-value").textContent = lastRSI
    ? lastRSI.toFixed(2)
    : "--";

  const rsiSignal = document.getElementById("rsi-signal");
  if (lastRSI > 70) {
    rsiSignal.textContent = "SELL";
    rsiSignal.className = "signal signal-sell";
  } else if (lastRSI < 30) {
    rsiSignal.textContent = "BUY";
    rsiSignal.className = "signal signal-buy";
  } else {
    rsiSignal.textContent = "NEUTRAL";
    rsiSignal.className = "signal signal-neutral";
  }

  return rsi;
}

// Create volume chart
function createVolumeChart() {
  if (!stockData || stockData.length === 0) return;

  // Check if Volume column exists
  if (!columns.includes("Volume")) {
    document.getElementById("volume-plot").innerHTML =
      "Volume data not available";
    return;
  }

  const dates = stockData.map((row) => new Date(row.Date));
  const volumes = stockData.map((row) => row.Volume);
  const prices = stockData.map((row) => row[selectedColumn]);

  // Determine colors based on price direction
  const colors = [];
  for (let i = 1; i < prices.length; i++) {
    colors.push(prices[i] >= prices[i - 1] ? "#28a745" : "#dc3545");
  }
  colors.unshift(colors[0]); // Add color for first bar

  const trace = {
    x: dates,
    y: volumes,
    type: "bar",
    marker: {
      color: colors,
    },
    name: "Volume",
  };

  const layout = {
    title: "Volume Analysis",
    height: 300,
    margin: { l: 40, r: 40, t: 40, b: 40 },
    xaxis: { title: "Date" },
    yaxis: { title: "Volume" },
  };

  Plotly.newPlot("volume-plot", [trace], layout);
}

// Update main chart with technical indicators
function updateChartWithIndicators(
  showMA,
  maPeriod,
  showBollinger,
  bollingerPeriod
) {
  const dates = stockData.map((row) => new Date(row.Date));
  const prices = stockData.map((row) => row[selectedColumn]);

  const traces = [
    {
      x: dates,
      y: prices,
      type: "scatter",
      mode: "lines",
      name: selectedColumn,
      line: { color: "#4D9AFF", width: 2 },
    },
  ];

  // Add moving average
  if (showMA) {
    const ma = calculateMA(prices, maPeriod);
    traces.push({
      x: dates,
      y: ma,
      type: "scatter",
      mode: "lines",
      name: `MA (${maPeriod})`,
      line: { color: "#ffc107", width: 2 },
    });
  }

  // Add Bollinger Bands
  if (showBollinger) {
    const bands = calculateBollingerBands(prices, bollingerPeriod);

    traces.push({
      x: dates,
      y: bands.upper,
      type: "scatter",
      mode: "lines",
      name: "Upper Band",
      line: { color: "#dc3545", width: 1, dash: "dash" },
    });

    traces.push({
      x: dates,
      y: bands.lower,
      type: "scatter",
      mode: "lines",
      name: "Lower Band",
      line: { color: "#28a745", width: 1, dash: "dash" },
    });

    // Fill between bands
    traces.push({
      x: dates.concat(dates.slice().reverse()),
      y: bands.upper.concat(bands.lower.slice().reverse()),
      fill: "toself",
      fillcolor: "rgba(77, 154, 255, 0.1)",
      line: { color: "transparent" },
      name: "Bollinger Band",
      showlegend: false,
    });

    // Update Bollinger Band value in technical summary
    const lastPrice = prices[prices.length - 1];
    const lastUpper = bands.upper[bands.upper.length - 1];
    const lastLower = bands.lower[bands.lower.length - 1];
    const lastMiddle = bands.ma[bands.ma.length - 1];

    if (lastPrice && lastUpper && lastLower) {
      const percentPosition = (
        ((lastPrice - lastLower) / (lastUpper - lastLower)) *
        100
      ).toFixed(1);
      document.getElementById("bb-value").textContent = `${percentPosition}%`;

      const bbSignal = document.getElementById("bb-signal");
      if (lastPrice > lastUpper) {
        bbSignal.textContent = "SELL";
        bbSignal.className = "signal signal-sell";
      } else if (lastPrice < lastLower) {
        bbSignal.textContent = "BUY";
        bbSignal.className = "signal signal-buy";
      } else {
        bbSignal.textContent = "NEUTRAL";
        bbSignal.className = "signal signal-neutral";
      }
    }
  }

  const layout = {
    title: `${selectedColumn} with Technical Indicators`,
    xaxis: { title: "Date" },
    yaxis: { title: "Price" },
    height: 400,
    showlegend: true,
    legend: {
      orientation: "h",
      y: -0.2,
    },
  };

  Plotly.newPlot("stock-plot", traces, layout);
}

// Calculate support and resistance levels
function calculateSupportResistance() {
  const prices = stockData.map((row) => row[selectedColumn]);

  // Get min/max for calculations
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const last = prices[prices.length - 1];
  const range = max - min;

  // Calculate pivot point (simple method: (high + low + close) / 3)
  const pivotPoint = (max + min + last) / 3;

  // Calculate resistance levels
  const r1 = 2 * pivotPoint - min;
  const r2 = pivotPoint + range;
  const r3 = r2 + range;

  // Calculate support levels
  const s1 = 2 * pivotPoint - max;
  const s2 = pivotPoint - range;
  const s3 = s2 - range;

  // Update the DOM
  document.getElementById("r1").querySelector("span").textContent =
    r1.toFixed(2);
  document.getElementById("r2").querySelector("span").textContent =
    r2.toFixed(2);
  document.getElementById("r3").querySelector("span").textContent =
    r3.toFixed(2);

  document.getElementById("s1").querySelector("span").textContent =
    s1.toFixed(2);
  document.getElementById("s2").querySelector("span").textContent =
    s2.toFixed(2);
  document.getElementById("s3").querySelector("span").textContent =
    s3.toFixed(2);
}

// Create technical summary
function createTechnicalSummary(rsiPeriod) {
  const prices = stockData.map((row) => row[selectedColumn]);
  const last = prices[prices.length - 1];

  // Calculate MACD
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);

  const macdLine = [];
  for (let i = 0; i < prices.length; i++) {
    if (ema12[i] !== null && ema26[i] !== null) {
      macdLine.push(ema12[i] - ema26[i]);
    } else {
      macdLine.push(null);
    }
  }

  // Calculate signal line (9-day EMA of MACD)
  const macdSignalLine = calculateEMA(
    macdLine.filter((val) => val !== null),
    9
  );

  // Pad the signal line with nulls to match the length of MACD line
  const paddedSignalLine = Array(macdLine.length - macdSignalLine.length)
    .fill(null)
    .concat(macdSignalLine);

  // Calculate MACD histogram
  const macdHistogram = [];
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] !== null && paddedSignalLine[i] !== null) {
      macdHistogram.push(macdLine[i] - paddedSignalLine[i]);
    } else {
      macdHistogram.push(null);
    }
  }

  // Update MACD value in technical summary
  const lastMACD = macdLine[macdLine.length - 1];
  const lastSignal = paddedSignalLine[paddedSignalLine.length - 1];
  const lastHistogram = macdHistogram[macdHistogram.length - 1];

  if (lastMACD !== null) {
    document.getElementById("macd-value").textContent = lastMACD.toFixed(2);

    const macdSignal = document.getElementById("macd-signal");
    if (lastMACD > 0 && lastHistogram > 0) {
      macdSignal.textContent = "BUY";
      macdSignal.className = "signal signal-buy";
    } else if (lastMACD < 0 && lastHistogram < 0) {
      macdSignal.textContent = "SELL";
      macdSignal.className = "signal signal-sell";
    } else {
      macdSignal.textContent = "NEUTRAL";
      macdSignal.className = "signal signal-neutral";
    }
  }

  // Calculate overall signal
  const rsiValue = parseFloat(document.getElementById("rsi-value").textContent);
  const bbSignal = document.getElementById("bb-signal").textContent;
  const macdSignalText = document.getElementById("macd-signal").textContent;

  let buySignals = 0;
  let sellSignals = 0;
  let totalSignals = 0;

  // Count RSI signal
  if (!isNaN(rsiValue)) {
    totalSignals++;
    if (rsiValue < 30) buySignals++;
    if (rsiValue > 70) sellSignals++;
  }

  // Count Bollinger signal
  if (bbSignal !== "--") {
    totalSignals++;
    if (bbSignal === "BUY") buySignals++;
    if (bbSignal === "SELL") sellSignals++;
  }

  // Count MACD signal
  if (macdSignalText !== "--") {
    totalSignals++;
    if (macdSignalText === "BUY") buySignals++;
    if (macdSignalText === "SELL") sellSignals++;
  }

  // Determine overall signal
  const overallSignal = document.getElementById("overall-signal");

  if (totalSignals > 0) {
    const buyRatio = buySignals / totalSignals;
    const sellRatio = sellSignals / totalSignals;

    if (buyRatio > 0.5) {
      overallSignal.textContent = "BUY";
      overallSignal.className = "signal signal-buy bold";
    } else if (sellRatio > 0.5) {
      overallSignal.textContent = "SELL";
      overallSignal.className = "signal signal-sell bold";
    } else {
      overallSignal.textContent = "NEUTRAL";
      overallSignal.className = "signal signal-neutral bold";
    }
  }

  // Add expanded technical analysis section
  const techAnalysisSection = document.createElement("div");
  techAnalysisSection.className = "tech-analysis-expanded mt-4";
  techAnalysisSection.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5><i class="fas fa-chart-line me-2"></i>Technical Analysis Summary</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <h6>RSI (${rsiPeriod}) Analysis</h6>
                        <p>Current Value: <strong>${
                          rsiValue ? rsiValue.toFixed(2) : "--"
                        }</strong></p>
                        <div class="indicator-explanation">
                            <p><i class="fas fa-info-circle me-1"></i> The Relative Strength Index (RSI) measures the speed and change of price movements on a scale of 0-100.</p>
                            <ul>
                                <li><span class="text-danger">Above 70</span>: Overbought condition - potential reversal down</li>
                                <li><span class="text-success">Below 30</span>: Oversold condition - potential reversal up</li>
                                <li>Between 30-70: Neutral trend</li>
                            </ul>
                            <p>Current Signal: <span class="badge ${
                              rsiValue > 70
                                ? "bg-danger"
                                : rsiValue < 30
                                ? "bg-success"
                                : "bg-secondary"
                            }">${
    rsiValue > 70 ? "OVERBOUGHT" : rsiValue < 30 ? "OVERSOLD" : "NEUTRAL"
  }</span></p>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6>MACD Analysis</h6>
                        <p>Current Value: <strong>${
                          lastMACD ? lastMACD.toFixed(2) : "--"
                        }</strong></p>
                        <div class="indicator-explanation">
                            <p><i class="fas fa-info-circle me-1"></i> The Moving Average Convergence Divergence (MACD) shows the relationship between two moving averages of a stock's price.</p>
                            <ul>
                                <li>MACD Line: Difference between 12-day EMA and 26-day EMA</li>
                                <li>Signal Line: 9-day EMA of MACD Line</li>
                                <li>Histogram: Difference between MACD and Signal Line</li>
                            </ul>
                            <p>Signal: <span class="badge ${
                              lastMACD > 0 && lastHistogram > 0
                                ? "bg-success"
                                : lastMACD < 0 && lastHistogram < 0
                                ? "bg-danger"
                                : "bg-secondary"
                            }">${
    lastMACD > 0 && lastHistogram > 0
      ? "BULLISH"
      : lastMACD < 0 && lastHistogram < 0
      ? "BEARISH"
      : "NEUTRAL"
  }</span></p>
                        </div>
                    </div>
                </div>
                <hr>
                <div class="row">
                    <div class="col-md-6">
                        <h6>Bollinger Bands Analysis</h6>
                        <p>Position within bands: <strong>${
                          document.getElementById("bb-value").textContent
                        }</strong></p>
                        <div class="indicator-explanation">
                            <p><i class="fas fa-info-circle me-1"></i> Bollinger Bands consist of a middle band (20-day SMA) with an upper and lower band (±2 standard deviations).</p>
                            <ul>
                                <li>Price near upper band: Potentially overbought</li>
                                <li>Price near lower band: Potentially oversold</li>
                                <li>"Band squeeze": Low volatility, potential breakout</li>
                                <li>"Band expansion": High volatility</li>
                            </ul>
                            <p>Current Signal: <span class="badge ${
                              bbSignal === "BUY"
                                ? "bg-success"
                                : bbSignal === "SELL"
                                ? "bg-danger"
                                : "bg-secondary"
                            }">${
    bbSignal === "BUY" ? "BULLISH" : bbSignal === "SELL" ? "BEARISH" : "NEUTRAL"
  }</span></p>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6>Support & Resistance</h6>
                        <p>Current Price: <strong>$${last.toFixed(
                          2
                        )}</strong></p>
                        <div class="indicator-explanation">
                            <p><i class="fas fa-info-circle me-1"></i> Support and resistance levels represent price points where the stock has historically had difficulty moving beyond.</p>
                            <p>Nearest Resistance: <strong>$${
                              document
                                .getElementById("r1")
                                .querySelector("span").textContent
                            }</strong></p>
                            <p>Nearest Support: <strong>$${
                              document
                                .getElementById("s1")
                                .querySelector("span").textContent
                            }</strong></p>
                            <p>Price is currently <strong>${
                              last >
                              parseFloat(
                                document
                                  .getElementById("r1")
                                  .querySelector("span").textContent
                              )
                                ? "ABOVE"
                                : last <
                                  parseFloat(
                                    document
                                      .getElementById("s1")
                                      .querySelector("span").textContent
                                  )
                                ? "BELOW"
                                : "BETWEEN"
                            }</strong> key levels.</p>
                        </div>
                    </div>
                </div>
                <hr>
                <div class="overall-analysis">
                    <h5>Overall Analysis</h5>
                    <div class="progress mb-3" style="height: 30px;">
                        <div class="progress-bar bg-success" role="progressbar" style="width: ${(
                          (buySignals / totalSignals) *
                          100
                        ).toFixed(0)}%;" aria-valuenow="${(
    (buySignals / totalSignals) *
    100
  ).toFixed(0)}" aria-valuemin="0" aria-valuemax="100">Buy: ${(
    (buySignals / totalSignals) *
    100
  ).toFixed(0)}%</div>
                        <div class="progress-bar bg-secondary" role="progressbar" style="width: ${(
                          ((totalSignals - buySignals - sellSignals) /
                            totalSignals) *
                          100
                        ).toFixed(0)}%;" aria-valuenow="${(
    ((totalSignals - buySignals - sellSignals) / totalSignals) *
    100
  ).toFixed(0)}" aria-valuemin="0" aria-valuemax="100">Neutral: ${(
    ((totalSignals - buySignals - sellSignals) / totalSignals) *
    100
  ).toFixed(0)}%</div>
                        <div class="progress-bar bg-danger" role="progressbar" style="width: ${(
                          (sellSignals / totalSignals) *
                          100
                        ).toFixed(0)}%;" aria-valuenow="${(
    (sellSignals / totalSignals) *
    100
  ).toFixed(0)}" aria-valuemin="0" aria-valuemax="100">Sell: ${(
    (sellSignals / totalSignals) *
    100
  ).toFixed(0)}%</div>
                    </div>
                    <p>Based on the analysis of multiple technical indicators, the current trading signal is: <span class="badge ${
                      overallSignal.textContent === "BUY"
                        ? "bg-success"
                        : overallSignal.textContent === "SELL"
                        ? "bg-danger"
                        : "bg-secondary"
                    } fs-6">${overallSignal.textContent}</span></p>
                    <p class="small text-muted mt-2"><i class="fas fa-exclamation-triangle me-1"></i> Technical analysis should be used in conjunction with fundamental analysis and risk management strategies. Past performance is not indicative of future results.</p>
                </div>
            </div>
        </div>
    `;

  // Check if expanded analysis already exists and remove it
  const existingAnalysis = document.querySelector(".tech-analysis-expanded");
  if (existingAnalysis) {
    existingAnalysis.remove();
  }

  // Add the expanded analysis section
  document
    .getElementById("indicators-section")
    .querySelector(".card-body")
    .appendChild(techAnalysisSection);
}

// Calculate Exponential Moving Average (EMA)
function calculateEMA(data, period) {
  const k = 2 / (period + 1);
  const ema = [];

  // Calculate simple moving average for first data point
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  const sma = sum / period;

  // Initial null values
  for (let i = 0; i < period - 1; i++) {
    ema.push(null);
  }

  // First EMA value is SMA
  ema.push(sma);

  // Calculate EMA for remaining data
  for (let i = period; i < data.length; i++) {
    ema.push(data[i] * k + ema[ema.length - 1] * (1 - k));
  }

  return ema;
}

// Enable and set up the CSV export button
function setupExportButton(data, columns) {
  const exportBtn = document.getElementById("export-csv");
  exportBtn.disabled = false;

  exportBtn.addEventListener("click", function () {
    // Create CSV content
    let csvContent = columns.join(",") + "\n";

    data.forEach((row) => {
      const rowValues = columns.map((column) => {
        // Format values properly for CSV
        if (column === "Date") {
          return new Date(row[column]).toLocaleDateString();
        } else if (typeof row[column] === "number") {
          return row[column].toFixed(2);
        } else {
          return row[column] || "";
        }
      });

      csvContent += rowValues.join(",") + "\n";
    });

    // Create blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // Create download link and click it
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${tickerSelect.value}_stock_data.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

// Update data summary statistics
function updateDataSummary(data, columns) {
  // Only process if we have the Close column
  if (!columns.includes("Close")) return;

  // Calculate some basic statistics
  const closes = data.map((row) => row.Close);
  const min = Math.min(...closes).toFixed(2);
  const max = Math.max(...closes).toFixed(2);
  const avg = (
    closes.reduce((sum, val) => sum + val, 0) / closes.length
  ).toFixed(2);

  // Calculate overall change
  const startPrice = closes[0];
  const endPrice = closes[closes.length - 1];
  const change = (((endPrice - startPrice) / startPrice) * 100).toFixed(2);
  const changeClass = change >= 0 ? "text-success" : "text-danger";
  const changeIcon =
    change >= 0
      ? '<i class="fas fa-arrow-up"></i>'
      : '<i class="fas fa-arrow-down"></i>';

  // Update the summary element
  const dataSummary = document.querySelector(".data-summary");
  dataSummary.innerHTML = `
        <div>
            <strong>Price Range:</strong> $${min} - $${max} | 
            <strong>Avg:</strong> $${avg} | 
            <strong>Overall:</strong> 
            <span class="${changeClass}">${changeIcon} ${Math.abs(
    change
  )}%</span>
        </div>
    `;
}

// Set default dates
function setDefaultDates() {
  // Set today's date as default end date
  const today = new Date();
  endDateInput.value = today.toISOString().split("T")[0];

  // Set default start date (1 year ago)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  startDateInput.value = oneYearAgo.toISOString().split("T")[0];
}

// Setup navigation
function setupNavigation() {
  // Navigation links
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll(".section-page");

  // Function to activate a section
  function activateSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) {
      console.error(`Section not found: ${sectionId}`);
      return false;
    }

    // Remove active class from all links
    navLinks.forEach((link) => link.classList.remove("active"));

    // Add active class to corresponding nav link
    const navLink = document.getElementById(
      `nav-${sectionId.replace("-section", "")}`
    );
    if (navLink) {
      navLink.classList.add("active");
    }

    // Hide all sections
    sections.forEach((s) => s.classList.remove("active-section"));

    // Show the target section
    section.classList.add("active-section");

    // Scroll to top immediately
    window.scrollTo(0, 0);

    // Force a reflow to ensure proper positioning
    section.offsetHeight;

    return true;
  }

  // Add click event listeners to nav links
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();

      // Get the target section ID
      const targetId = this.getAttribute("href").substring(1);
      activateSection(targetId);
    });
  });

  // Get Started button should navigate to forecast section
  const getStartedBtn = document.getElementById("get-started-btn");
  if (getStartedBtn) {
    getStartedBtn.addEventListener("click", function () {
      activateSection("forecast-section");
    });
  }

  // Expose the activateSection function globally
  window.activateSection = activateSection;

  // Show home section by default
  document.getElementById("home-section").classList.add("active-section");
  document.getElementById("nav-home").classList.add("active");
}

// Global loading spinner functions
function showGlobalSpinner() {
  const spinner = document.getElementById("global-loading-spinner");
  spinner.classList.add("active");
}

function hideGlobalSpinner() {
  const spinner = document.getElementById("global-loading-spinner");
  spinner.classList.remove("active");
}

// Update navigation click handlers
document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", function (e) {
    e.preventDefault();
    const targetId = this.getAttribute("href").substring(1);

    // Show spinner
    showGlobalSpinner();

    // Hide all sections
    document.querySelectorAll(".section-page").forEach((section) => {
      section.classList.remove("active-section");
    });

    // Show target section with a slight delay for smooth transition
    setTimeout(() => {
      document.getElementById(targetId).classList.add("active-section");
      // Hide spinner after section is shown
      hideGlobalSpinner();
    }, 500);

    // Update active nav link
    document.querySelectorAll(".nav-link").forEach((navLink) => {
      navLink.classList.remove("active");
    });
    this.classList.add("active");
  });
});
