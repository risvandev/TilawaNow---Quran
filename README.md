# TilawaNow

Welcome to **TilawaNow**, a modern, comprehensive platform designed to connect you with the Holy Qur'an deeply and personally.

## 🌟 About

TilawaNow provides a seamless and spiritually enriching experience for reading, understanding, and tracking your journey with the Qur'an. Whether you are a daily reciter or a student of knowledge, our tools are designed to support your growth.

## ✨ Key Features

### 🤖 Advanced AI Assistance
- **Quran Expert AI**: Ask deep questions about verses, context, and meanings.
- **Smart Search**: Find exactly what you are looking for with semantic understanding.
- **Instant Answers**: Get immediate responses to your questions about the site and its features.

### 📊 Progress Tracking
- **Personal Tracking Facility**: Keep track of your daily reading habits, streak, and completion goals.
- **Visual Insights**: Monitor your spiritual consistency with intuitive charts and stats.

### 🌍 Universal Accessibility
- **Multi-language Support**: Get explanations, translations, and meanings in **every language**.
- **Global Understanding**: The platform ensures that the message of the Qur'an is accessible to everyone, regardless of their native tongue.
- **Tafsir & Context**: Deep dive into the meanings behind the verses with comprehensive explanations.

### 📱 Modern Experience
- **Mobile-First Design**: Optimized for reading on the go with a minimal and focused UI.
- **Beautiful Typography**: Enhanced readability for both Arabic script and translations.
- **Dark Mode**: A premium, eye-friendly reading environment.

## 🛠️ Built With

- **Supabase** (Database, Auth, RLS)
- **Radix UI** & **shadcn/ui** (Accessible UI)
- **Puter.js** & **OpenRouter** (AI Integration)
- **Lenis** (Smooth Scrolling)

## 🏗️ Architecture Overview

TilawaNow is designed with a production-grade, scalable architecture:

- **Next.js App Router**: Organized within `src/app` for efficient routing and server-side rendering.
- **Domain-Driven Components**: UI is split into logical domains (auth, landing, player, reader) for maintainability.
- **Context-Based State**: Global state is managed through React Context (e.g., `AuthContext`), ensuring data consistency across the platform.
- **AI Pipeline**: A custom service layer integrates **Puter.js** and **OpenRouter**, providing streaming AI assistance grounded in verified Quranic data.
- **Secure Backend**: Leveraging **Supabase** with strict Row Level Security (RLS) policies to protect user data and reading progress.
- **PWA Ready**: Built to be installable and performant on mobile devices.

## 📖 The Story

TilawaNow was born out of a simple need: **depth without distraction**. 

Many Quran applications are either too basic for serious study or too cluttered with ads and complex features. This platform focuses on the essentials—reading, listening, and understanding—powered by modern AI to help bridge the gap between traditional scholarship and the digital age.

---

## 📸 Preview

![Desktop Preview](https://github.com/risvandev/TilawaNow---Quran/raw/main/public/preview-desktop.png)
*Desktop Reader Interface*

![Mobile Preview](https://github.com/risvandev/TilawaNow---Quran/raw/main/public/preview-mobile.png)
*PWA Experience on Mobile*

## 🔗 Live Demo

Experience it live: **[TilawaNow.com](https://tilawanow.com)** (Coming Soon / Replace with real link)

---

## 🚀 Getting Started

To run this project locally:

```sh
# Clone the repository
git clone https://github.com/risvandev/TilawaNow---Quran.git

# Install dependencies
npm install

# Start the development server
npm run dev
```


---

## 📄 License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL v3)**.

> **IMPORTANT**: If you run a modified version of this software publicly, you **must** disclose your source code under the same license. This ensures that improvements made to the platform benefit the entire community.

See the [LICENSE](LICENSE) file for the full text.

## ⚖️ Copyright

Copyright (c) 2026 **Muhammed Risvan**. All rights reserved.

---

<p align="center">
  <em>Built voluntarily to serve the Qur'an. Access is always free.</em>
</p>
