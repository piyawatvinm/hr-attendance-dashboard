# HR Time Attendance Dashboard

Modern web application for processing and analyzing Eagle System HR attendance reports.

## Features

- 📤 **Drag & Drop Upload** - Easy Excel file upload
- 🔄 **Automatic Data Transformation** - Converts Eagle System format to clean data
- 📊 **Interactive Dashboard** - Visual analytics with charts
- 📈 **OT Analysis** - Breakdown by employee, rate, and time
- 🔍 **Search & Filter** - Find employees quickly
- 💾 **Export Options** - Download as CSV, Excel, or JSON
- 🎨 **Kellogg Branding** - Premium UI with company theme

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
```

## Usage

1. Upload your Eagle System attendance report (Excel file)
2. View automated analytics and insights
3. Search and filter employee data
4. Export cleaned data in your preferred format

## Technology Stack

- **React** - UI framework
- **Vite** - Build tool
- **Recharts** - Data visualization
- **SheetJS** - Excel processing
- **CSS** - Custom styling with Kellogg branding

## Project Structure

```
src/
├── components/
│   ├── Charts/
│   │   ├── OTByEmployee.jsx
│   │   ├── OTTrend.jsx
│   │   └── OTByRate.jsx
│   ├── Dashboard.jsx
│   ├── EmployeeTable.jsx
│   ├── ExportButtons.jsx
│   ├── FileUpload.jsx
│   └── SummaryCards.jsx
├── utils/
│   ├── dataTransformer.js
│   ├── dateUtils.js
│   ├── excelParser.js
│   └── exportUtils.js
├── App.jsx
├── main.jsx
└── index.css
```

## License

Proprietary - Kellogg (Thailand) Limited
