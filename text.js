// <!DOCTYPE html>
// <html lang="en">

// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Yash.RK.Mishra | Full Stack Developer</title>

//     <script src="https://cdn.tailwindcss.com"></script>

//     <link rel="preconnect" href="https://fonts.googleapis.com">
//     <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
//     <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
//         rel="stylesheet">

//     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

//     <script>
//         tailwind.config = {
//             theme: {
//                 extend: {
//                     fontFamily: {
//                         sans: ['Plus Jakarta Sans', 'sans-serif'],
//                     },
//                     colors: {
//                         canvas: '#f3f4f6',
//                         card: '#ffffff',
//                         txt: '#111827',
//                         sub: '#6b7280',
//                     },
//                     animation: {
//                         'fade-in': 'fadeIn 0.5s ease-out forwards',
//                     },
//                     keyframes: {
//                         fadeIn: {
//                             '0%': { opacity: '0', transform: 'translateY(10px)' },
//                             '100%': { opacity: '1', transform: 'translateY(0)' },
//                         }
//                     }
//                 }
//             }
//         }
//     </script>

//     <style>
//         body {
//             background-color: #f3f4f6;
//             background-image: radial-gradient(#e5e7eb 1px, transparent 1px);
//             background-size: 24px 24px;
//         }

//         .bento-card {
//             background: white;
//             border: 1px solid rgba(0, 0, 0, 0.04);
//             box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
//             transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
//         }

//         .bento-card:hover {
//             transform: translateY(-4px);
//             box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);
//             border-color: rgba(0, 0, 0, 0.08);
//         }

//         .tech-icon {
//             transition: transform 0.2s;
//         }

//         .tech-icon:hover {
//             transform: scale(1.1);
//         }

//         .svg-icon {
//             width: 32px;
//             height: 32px;
//         }
//     </style>
// </head>

// <body class="min-h-screen p-4 sm:p-8 flex items-center justify-center text-txt">

//     <div class="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-4">

//         <div class="bento-card md:col-span-2 rounded-3xl p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 animate-fade-in"
//             style="animation-delay: 0ms;">
//             <div class="w-24 h-24 rounded-2xl overflow-hidden shadow-sm flex-shrink-0 bg-gray-200">
//                 <img src="./profile.jpg" alt="Profile" class="w-full h-full object-cover">
//             </div>
//             <div class="flex-1 text-center sm:text-left">
//                 <div
//                     class="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold mb-3 tracking-wide uppercase">
//                     Available for work
//                 </div>
//                 <h1 class="text-3xl font-extrabold tracking-tight mb-2 text-gray-900">Yash.RK.Mishra</h1>
//                 <p class="text-sub text-sm leading-relaxed max-w-md mb-4">
//                     Full Stack Developer crafting scalable web applications using the MERN stack and TypeScript.
//                 </p>
                
//                 <div class="flex items-center justify-center sm:justify-start gap-2 text-sm font-medium text-sub">
//                     <i class="fas fa-map-marker-alt text-red-500"></i>
//                     <span>Based in India 🇮🇳</span>
//                 </div>
//             </div>
//         </div>

//         <a href="./resume.pdf" target="_blank"
//             class="bento-card rounded-3xl p-6 flex flex-col justify-center items-center gap-4 group animate-fade-in cursor-pointer hover:bg-gray-50"
//             style="animation-delay: 100ms;">
//             <div class="relative">
//                 <div class="w-14 h-14 rounded-full bg-gray-900 text-white flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
//                     <i class="fas fa-file-arrow-down"></i>
//                 </div>
//             </div>
//             <div class="text-center">
//                 <h2 class="text-lg font-bold text-gray-900">Resume</h2>
//                 <p class="text-xs text-sub mt-1 group-hover:text-gray-900 transition-colors">Download CV</p>
//             </div>
//         </a>

//         <div class="bento-card md:row-span-2 rounded-3xl p-6 animate-fade-in flex flex-col" style="animation-delay: 200ms;">
//             <h3 class="font-bold text-lg mb-6 flex items-center gap-2">
//                 <i class="fas fa-layer-group text-indigo-500"></i> Stack
//             </h3>

//             <div class="grid grid-cols-2 gap-y-8 gap-x-2 text-center flex-1 content-center">

//                 <div class="tech-icon flex flex-col items-center gap-2 cursor-default">
//                     <i class="fab fa-js text-3xl text-yellow-500"></i>
//                     <span class="text-xs font-medium text-sub">JavaScript</span>
//                 </div>

//                 <div class="tech-icon flex flex-col items-center gap-2 cursor-default">
//                     <svg class="svg-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//                         <rect width="24" height="24" rx="4" fill="#3178C6" />
//                         <path d="M11.8 8H6.5V9.5H8.3V17H10V9.5H11.8V8Z" fill="white" />
//                         <path d="M17.5 14.1C17.5 13 16.8 12.6 15.6 12.2L15 12C14.3 11.8 13.8 11.6 13.8 11.1C13.8 10.6 14.3 10.3 14.9 10.3C15.5 10.3 16 10.6 16.3 11.1L17.6 10.3C17.1 9.3 16.2 8.8 14.9 8.8C13.2 8.8 12.1 9.8 12.1 11.2C12.1 12.5 13 13.1 14 13.5L14.7 13.7C15.6 14 15.9 14.3 15.9 14.8C15.9 15.4 15.3 15.7 14.7 15.7C13.9 15.7 13.3 15.3 13 14.6L11.5 15.3C12 16.6 13.2 17.2 14.7 17.2C16.6 17.2 17.5 16.1 17.5 14.1Z" fill="white" />
//                     </svg>
//                     <span class="text-xs font-medium text-sub">TypeScript</span>
//                 </div>

//                 <div class="tech-icon flex flex-col items-center gap-2 cursor-default">
//                     <i class="fab fa-react text-3xl text-blue-400"></i>
//                     <span class="text-xs font-medium text-sub">React</span>
//                 </div>

//                 <div class="tech-icon flex flex-col items-center gap-2 cursor-default">
//                     <i class="fab fa-node text-3xl text-green-500"></i>
//                     <span class="text-xs font-medium text-sub">Node</span>
//                 </div>

//                 <div class="tech-icon flex flex-col items-center gap-2 cursor-default">
//                     <svg class="svg-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//                         <circle cx="12" cy="12" r="12" fill="#000000" fill-opacity="0.05" />
//                         <text x="50%" y="55%" font-family="monospace" font-weight="bold" font-size="14px" fill="#000" text-anchor="middle" dominant-baseline="middle">ex</text>
//                     </svg>
//                     <span class="text-xs font-medium text-sub">Express</span>
//                 </div>

//                 <div class="tech-icon flex flex-col items-center gap-2 cursor-default">
//                     <i class="fas fa-database text-3xl text-green-600"></i>
//                     <span class="text-xs font-medium text-sub">MongoDB</span>
//                 </div>
//             </div>
//         </div>

//         <a href="https://www.linkedin.com/in/yash-mishra-356280223/" target="_blank"
//             class="bento-card rounded-3xl p-6 flex flex-col justify-center items-center gap-3 group animate-fade-in"
//             style="animation-delay: 300ms;">
//             <div
//                 class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
//                 <i class="fab fa-linkedin-in"></i>
//             </div>
//             <div class="text-center">
//                 <span class="block font-bold text-sm">LinkedIn</span>
//                 <span class="text-xs text-sub group-hover:text-blue-600 transition-colors">Connect</span>
//             </div>
//         </a>

//         <a href="https://github.com/YashMishra0101" target="_blank"
//             class="bento-card rounded-3xl p-6 flex flex-col justify-center items-center gap-3 group animate-fade-in"
//             style="animation-delay: 400ms;">
//             <div
//                 class="w-10 h-10 rounded-full bg-gray-50 text-gray-900 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
//                 <i class="fab fa-github"></i>
//             </div>
//             <div class="text-center">
//                 <span class="block font-bold text-sm">GitHub</span>
//                 <span class="text-xs text-sub group-hover:text-gray-900 transition-colors">View Code</span>
//             </div>
//         </a>

//         <a href="https://x.com/YashRKMishra1" target="_blank"
//             class="bento-card rounded-3xl p-6 flex flex-col justify-center items-center gap-3 group animate-fade-in"
//             style="animation-delay: 500ms;">
//             <div
//                 class="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
//                 <i class="fa-brands fa-x-twitter"></i>
//             </div>
//             <div class="text-center">
//                 <span class="block font-bold text-sm">Twitter</span>
//                 <span class="text-xs text-sub group-hover:text-gray-900 transition-colors">Follow</span>
//             </div>
//         </a>

//         <a href="mailto:yashrkm0011@gmail.com"
//             class="bento-card rounded-3xl p-6 flex flex-col justify-center items-center gap-3 group animate-fade-in"
//             style="animation-delay: 600ms;">
//             <div
//                 class="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
//                 <i class="fas fa-envelope"></i>
//             </div>
//             <div class="text-center">
//                 <span class="block font-bold text-sm">Email</span>
//                 <span class="text-xs text-sub group-hover:text-red-500 transition-colors">Message</span>
//             </div>
//         </a>

//     </div>
// </body>

// </html>