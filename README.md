# TilawaNow

[![Vercel Deployment](https://img.shields.io/badge/Deployment-Vercel-black?style=flat-square&logo=vercel)](https://tilawanow.vercel.app)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg?style=flat-square)](https://www.gnu.org/licenses/agpl-3.0)
[![Next.js](https://img.shields.io/badge/Framework-Next.js%2014-black?style=flat-square&logo=next.js)](https://nextjs.org/)

**TilawaNow** is a production-grade, open-source Quranic platform built for high-performance reading, analysis, and progress auditing. It integrates modern AI grounding with classical scholarship to provide a distraction-free environment for serious study.

---

## 📸 Preview

![Desktop Reader](https://github.com/risvandev/TilawaNow---Quran/raw/main/public/preview-desktop.png)
*Desktop interface featuring clean typography and AI side-panel.*

![Mobile PWA](https://github.com/risvandev/TilawaNow---Quran/raw/main/public/preview-mobile.png)
*PWA optimized for performance on mobile devices.*

---

## 🎯 What It Is

TilawaNow is a technical solution to a common problem: digital Quran platforms often suffer from feature bloat, intrusive ads, or lack of analytical depth. This project provides:
- A high-fidelity, minimal reader interface.
- Verified grounding for AI-assisted explanations (Tafsir).
- Comprehensive data-driven tracking for reading habits.
- Secure, private-first authentication and data storage.

## 🚀 Core Features

- **AI-Assisted Grounding**: Utilizes Puter.js and OpenRouter to provide explanations grounded in verified Tafsir (Ibn Kathir).
- **Audit System**: Real-time tracking of unique Ayahs read, streaks, and total completion stats.
- **Dynamic Reader**: Custom-built reader supporting multiple scripts (Uthmani, IndoPak, Imlaei) and translations.
- **Audio Pipeline**: Multi-reciter audio integration with word-level highlighting and synchronization.
- **PWA Architecture**: Full support for native installation on iOS, Android, and Desktop.
- **Dark Mode Engine**: Premium dark mode and "Night Mode" eye-filter for prolonged usage.

## 🏗️ Architecture

TilawaNow is built with a focus on scalability and maintainability:

- **Frontend**: Next.js 14 (App Router) with React Server Components for optimal SEO and initial load performance.
- **State Management**: Context-based architecture (Auth, UI state) to ensure consistency across the player and reader.
- **AI Pipeline**: Custom service layer integrating **Puter.js** for browser-side LLM interaction and **OpenRouter** for advanced models.
- **Database**: Supabase PostgreSQL with **Row Level Security (RLS)** ensuring every data point is owned and accessible only by the user.
- **Styling**: Tailwind CSS with a strict design system (Radix UI primitives).

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 14 |
| **Language** | TypeScript |
| **Database/Auth** | Supabase |
| **AI SDK** | Puter.js / OpenRouter |
| **Styling** | Tailwind CSS / shadcn/ui |
| **Animations** | Lenis (Smooth Scroll) / Framer Motion |
| **Email** | Nodemailer (SMTP) |

## ⚙️ Local Setup

### Prerequisites
- Node.js 18.x or higher
- A Supabase Project (URL and Anon Key)
- SMTP Credentials (for contact/invites)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/risvandev/TilawaNow---Quran.git
   cd TilawaNow---Quran
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase and SMTP details.

4. **Initialize Database**
   Execute the contents of `database_setup.sql` in your Supabase SQL Editor.

5. **Run Development Server**
   ```bash
   npm run dev
   ```

## 📄 License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL v3)**.

> [!IMPORTANT]
> **Mandatory Disclosure**: If you modify and deploy this software publicly (even as a web service), you **must** make your source code available under the same license. See the [LICENSE](LICENSE) file for details.

## 🔭 Vision

The goal of TilawaNow is **depth without distraction**. By bridging classical scholarship with modern AI, we aim to provide tools that help users not just read the Quran, but analyze and retain its message with technical precision and spiritual focus.

## ✍️ Author

**Muhammed Risvan**
- GitHub: [@risvandev](https://github.com/risvandev)
- Website: [tilawanow.vercel.app](https://tilawanow.vercel.app)

---

<p align="center">
  <em>Built for the Ummah. Always Open. Always Free.</em>
</p>
