# CareCompanion: Prescription & Medicine Tracker

CareCompanion is an intuitive, mobile-friendly web application designed to help manage medication schedules with care and precision. Using Google Gemini AI, it digitizes physical prescriptions, suggests optimal daily timings, and checks for safety interactions with OTC remedies.

## ✨ Features

- **AI Prescription Extraction**: Snap or upload a photo of a doctor's prescription. CareCompanion uses Gemini 3.1 Flash to extract names, dosages, and frequencies automatically.
- **Intelligent Scheduling**: Automatically builds a 10-day intake schedule based on standard slots (Morning, Afternoon, Evening, Night).
- **Safety Interaction Checker**: Add natural remedies or OTC medicines (like Vitamin C or Ibuprofen) and let the AI analyze potential clinical interactions with prescribed drugs.
- **Visual Progress Tracking**: Real-time daily progress bar and attendance-style intake tracking.
- **Activity Log**: Maintains a history of taken and missed doses for clinical oversight.
- **Mobile First**: Designed with a sleek, responsive UI using Tailwind CSS and Framer Motion.

## 🚀 Getting Started

### Prerequisites

- A modern web browser.
- A Google Gemini API Key.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/care-companion.git
   cd care-companion
   ```

2. Set up your environment variables:
   Create a `.env` file (or set in your hosting provider) with:
   ```env
   API_KEY=your_gemini_api_key_here
   ```

3. Start the application:
   The app is built as an ES6 module project. You can serve it using any local development server (like Vite or Live Server).

## 🛠️ Tech Stack

- **Framework**: React 19
- **State Management**: Zustand (with Persist middleware)
- **AI Engine**: Google Gemini API (@google/genai)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Toast Notifications**: React Hot Toast

## 🛡️ Medical Disclaimer

CareCompanion is a tracking tool and uses AI to assist with organization. **It is not a substitute for professional medical advice, diagnosis, or treatment.** Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition or medication interaction.

---
Built with ❤️ for better health.