# Reloop – স্ক্র্যাপ বাইব্যাক ও মার্কেটপ্লেস

ফ্রন্টএন্ড (`public/`), ব্যাকএন্ড (`api/`, `lib/`) ও ডেটাবেস (`db/schema.sql`) সব এই ফোল্ডারে আছে।
হোস্টিং: **Vercel** (ওয়েবসাইট + API) ও **Neon** (ডেটাবেস, বিনামূল্যে প্ল্যান আছে)।

## ফোল্ডারে কী আছে
- `public/` : ওয়েবসাইট (index.html, css/style.css, js/app.js)
- `api/` : সার্ভার ফাংশন (auth, setup, rates, requests, listings, messages)
- `lib/` : ডেটাবেস সংযোগ, লগইন সেশন, স্কিমা
- `db/schema.sql` : টেবিলের SQL (রেফারেন্স; প্রথম সেটআপ ধাপে অ্যাপ নিজেই টেবিল বানিয়ে নেয়)
- `.env.example` : যে তিনটি গোপন মান লাগবে তার নমুনা

## ধাপ ১: ডেটাবেস বানান (Neon)
1. https://neon.tech এ গিয়ে সাইন আপ করুন, **Create project** চাপুন (নাম: reloop)।
2. প্রজেক্ট খোলার পর **Connection string** কপি করুন। দেখতে `postgresql://...neon.tech/neondb?sslmode=require` এর মতো। এটাই আপনার `DATABASE_URL`।

## ধাপ ২: তিনটি গোপন মান ঠিক করুন
1. `DATABASE_URL` : ধাপ ১ এর লিংক।
2. `JWT_SECRET` : ৩২ অক্ষরের বেশি যেকোনো এলোমেলো লেখা। কম্পিউটারে Node থাকলে টার্মিনালে এটা চালান:
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. `ADMIN_SETUP_KEY` : আপনার বানানো একটি গোপন কোড (প্রথম অ্যাডমিন বানানোর সময় লাগবে)।

## ধাপ ৩: কোড GitHub-এ তুলুন
1. https://github.com এ নতুন **private** রিপোজিটরি বানান (নাম: reloop)।
2. **uploading an existing file** লিংকে গিয়ে আনজিপ করা ফোল্ডারের ভেতরের সব ফাইল ও ফোল্ডার টেনে এনে ছেড়ে দিন (ফোল্ডার হিসেবে api, lib, db, public সহ) এবং **Commit changes** দিন।
   বিকল্প: টার্মিনালে `git init`, `git add .`, `git commit -m "first"`, তারপর GitHub-এর দেওয়া `git remote add` ও `git push` কমান্ড।

## ধাপ ৪: Vercel-এ ডিপ্লয় করুন
1. https://vercel.com এ GitHub দিয়ে সাইন আপ করুন।
2. **Add New → Project** চাপুন, `reloop` রিপোজিটরি **Import** করুন।
3. **Framework Preset**: `Other` রাখুন। Build Command ও Output Directory ফাঁকা বা ডিফল্ট থাকুক (`vercel.json` ঠিক করে দেয়)।
4. **Environment Variables** অংশে ধাপ ২ এর তিনটি মান (নাম ঠিক এভাবেই) যোগ করুন: `DATABASE_URL`, `JWT_SECRET`, `ADMIN_SETUP_KEY`।
5. **Deploy** চাপুন। ১ মিনিটের মধ্যে `https://আপনার-নাম.vercel.app` লিংক পাবেন।

## ধাপ ৫: প্রথম অ্যাডমিন তৈরি
1. সাইটে যান: `https://আপনার-নাম.vercel.app/#setup`
2. ধাপ ২ এর `ADMIN_SETUP_KEY`, আপনার নাম, ইমেইল ও পাসওয়ার্ড দিন। এতে টেবিল তৈরি হবে, ডিফল্ট রেট বসবে ও আপনি অ্যাডমিন হিসেবে ঢুকে যাবেন।
3. **Profile** ট্যাবে আপনার WhatsApp নম্বর দিন। এটি ব্যবহারকারীদের কাছে "সাপোর্ট" যোগাযোগ হিসেবে দেখাবে।
4. **Rates** ট্যাবে নিজের রেট ঠিক করুন।

## ব্যবহার
- **ইউজার:** রেজিস্টার করার সময় WhatsApp ও ফোন নম্বর দিন। স্ক্র্যাপ বিক্রির রিকোয়েস্ট পাঠান, মার্কেটপ্লেসে পণ্য তুলুন, বিক্রেতাকে মেসেজ, WhatsApp বা কল করুন।
- **সেলার প্যানেল:** "My listings" ট্যাব।
- **অ্যাডমিন প্যানেল:** "Buyback requests" ও "Rates" ট্যাব (শুধু অ্যাডমিন দেখে)। প্রতিটি রিকোয়েস্টের পাশে WhatsApp, Call ও Message বোতাম আছে।
- **একাধিক অ্যাকাউন্ট:** "Accounts" ট্যাবে একই ডিভাইসে সর্বোচ্চ ৭টি অ্যাকাউন্ট যুক্ত, সুইচ ও রিমুভ করা যায়। লগইন ৬০ দিন থাকে।

## নিজের কম্পিউটারে চালিয়ে দেখা (ঐচ্ছিক)
1. Node.js (১৮ বা নতুন) ইনস্টল করুন, ফোল্ডারে `npm install` চালান।
2. `.env.example` কপি করে `.env` নাম দিন এবং মানগুলো বসান।
3. `npx vercel dev` চালান (প্রথমবার Vercel লগইন চাইবে)।

## নিজের ডোমেইন
Vercel প্রজেক্টের **Settings → Domains** এ ডোমেইন যোগ করে ডিএনএস নির্দেশনা মেনে চলুন।

## সমস্যা হলে
- "Server error": Vercel-এর **Logs** দেখুন। সাধারণত তিনটি Environment Variable ঠিকমতো বসেনি। মান বদলালে **Redeploy** দিন।
- "The setup key is incorrect": `ADMIN_SETUP_KEY` মিলছে না।
- সেটআপের পর আবার `#setup` খুললে "Setup is already complete" আসবে, এটা স্বাভাবিক।

## সীমাবদ্ধতা (সৎ কথা)
- ছবি আপলোড, ইমেইল নোটিফিকেশন, অনলাইন পেমেন্ট এবং পাসওয়ার্ড রিসেট নেই।
- লগইনে ব্রুট-ফোর্স সীমা (rate limit) নেই। বেশি ব্যবহারকারী হলে Vercel Firewall চালু করুন।
- মেসেজ প্রতি ১০ সেকেন্ডে আপডেট হয় (রিয়েল-টাইম সকেট নয়)।
