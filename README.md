# 🚀 DevCircle

DevCircle is a full-stack social platform built for developers to connect, share ideas, and book real sessions with each other.

The goal of this project was simple — build something that feels like a real product, not just another demo.  
Instead of passive scrolling, DevCircle focuses on direct interaction through booking and collaboration.

---

## 🌐 Live Demo

👉 Synapse Dev Network

---

## ✨ Overview

Users can create an account and start using the app instantly. Each user has their own profile, can create posts, follow others, and interact through a clean and responsive interface.

The platform includes:

- Global feed and following feed  
- Explore page for discovering developers  
- Profile pages with booking functionality  
- Real interaction flows between users  

---

## 🔒 Authentication & Session Handling

A major focus of this project was making authentication behave like a real application:

- Each login starts with a clean session  
- No data from previous users is kept  
- Fresh data is fetched on every login  
- User data is fully isolated between accounts  

This ensures a reliable and production-like experience.

---

## 📅 Booking System (Core Feature)

The booking system is designed to simulate real-world product behavior:

- Users can book sessions directly from other developer profiles  
- Time slots are clearly separated into:
  - Available  
  - Selected  
  - Booked  
  - Past  
- Only available slots are clickable  
- Selected slot updates instantly with visual feedback  
- Confirm button activates only after slot selection  
- Booking updates UI immediately after confirmation  
- Each user sees only their own bookings  

This demonstrates handling of:

- UI state management  
- user-specific data  
- interaction feedback  
- realistic product flows  

---

## 🎨 UI & Experience

The interface is designed to be:

- Clean and minimal  
- Fully responsive (mobile-first)  
- Easy to navigate  

Small details that improve the experience:

- Smooth transitions  
- Hover states  
- Loading states  
- Clear feedback messages  

The goal was to make the app feel alive and interactive, not static.

---

## 🛠 Tech Stack

Frontend:
- React.js  
- Next.js  
- TypeScript  

Backend / Database:
- Supabase (Authentication + Database)  
- PostgreSQL  

Other:
- REST APIs  
- Component-based architecture  
- Modern UI patterns  

---

## 💡 Problem

Most developer platforms are passive.

You scroll, like posts, and move on — but real interaction rarely happens.

---

## ⚡ Solution

DevCircle introduces a booking-based interaction model.

Instead of endless networking, developers can:

- Book short sessions  
- Collaborate directly  
- Have focused, real conversations  

---

---

## 🧪 Running Locally

1. Clone the repository:git clone https://github.com/Dimson7777/synapse-dev-network.git
2. Navigate into the project:cd synapse-dev-network
3. Install dependencies:npm install
4. Start development server:npm run dev
App runs on:http://localhost:3000


---

## 🔥 Key Highlights

- Real booking system with interactive UI  
- Clean session handling (no shared user data)  
- Production-like UX with feedback states  
- Full-stack architecture  
- Connected features (not isolated pages)  

---

## 📌 Future Improvements

- Real-time booking updates  
- Notifications system  
- Messaging between users  
- Calendar integrations  
- Advanced search  

---

## 👨‍💻 Author

Dimitrije Bukejlovic  
GitHub: https://github.com/Dimson7777
Portfolio:https://dimitrijeswebsite.lovable.app/

---

## 📣 Final Note

This project was built to simulate a real-world application —  
with proper architecture, user flows, and attention to detail.

Still improving and shipping 🚀
