// ═══════════════════════════════════════════════════════════════
// AI BOT SİSTEMİ — Kişilikli Botlar
// ═══════════════════════════════════════════════════════════════

const BOT_PROFILES = [
  { 
    username: 'ayse_dev', 
    displayName: 'Ayşe Yılmaz', 
    bio: '💻 Yazılım Geliştirici | React & Node.js', 
    verified: true,
    personality: 'tech',
    interests: ['yazılım', 'react', 'nodejs', 'typescript', 'ai', 'startup'],
    mood: ['heyecanlı', 'meraklı', 'yardımsever'],
    style: 'profesyonel ve teknik'
  },
  { 
    username: 'mehmet_tasarim', 
    displayName: 'Mehmet Kaya', 
    bio: '🎨 UI/UX Tasarımcı | Minimalist', 
    verified: true,
    personality: 'creative',
    interests: ['tasarım', 'ui', 'ux', 'figma', 'renk', 'tipografi'],
    mood: ['yaratıcı', 'estetik', 'detaycı'],
    style: 'görsel ve sanatsal'
  },
  { 
    username: 'zeynep_muzik', 
    displayName: 'Zeynep Demir', 
    bio: '🎵 Müzik Prodüktörü | Piyano', 
    verified: false,
    personality: 'artistic',
    interests: ['müzik', 'piyano', 'prodüksiyon', 'konser', 'jazz', 'klasik'],
    mood: ['duygusal', 'melodik', 'romantik'],
    style: 'lirik ve duygusal'
  },
  { 
    username: 'ahmet_foto', 
    displayName: 'Ahmet Çelik', 
    bio: '📸 Fotoğrafçı | Doğa & Portre', 
    verified: false,
    personality: 'visual',
    interests: ['fotoğraf', 'doğa', 'portre', 'ışık', 'kompozisyon', 'seyahat'],
    mood: ['gözlemci', 'sabırlı', 'detaycı'],
    style: 'görsel ve betimleyici'
  },
  { 
    username: 'elif_yazar', 
    displayName: 'Elif Arslan', 
    bio: '✍️ Yazar | Roman & Şiir', 
    verified: true,
    personality: 'literary',
    interests: ['edebiyat', 'roman', 'şiir', 'hikaye', 'kitap', 'yazarlık'],
    mood: ['düşünceli', 'felsefi', 'derin'],
    style: 'edebi ve akıcı'
  },
  { 
    username: 'can_spor', 
    displayName: 'Can Öztürk', 
    bio: '⚽ Spor Yorumcusu | Futbol Analizi', 
    verified: false,
    personality: 'sports',
    interests: ['futbol', 'basketbol', 'spor', 'analiz', 'takım', 'antrenman'],
    mood: ['enerjik', 'rekabetçi', 'tutkulu'],
    style: 'dinamik ve heyecanlı'
  },
  { 
    username: 'selin_chef', 
    displayName: 'Selin Aydın', 
    bio: '👩‍🍳 Şef | Türk Mutfağı', 
    verified: false,
    personality: 'culinary',
    interests: ['yemek', 'tarif', 'mutfak', 'lezzet', 'türk mutfağı', 'gastronomi'],
    mood: ['sıcak', 'paylaşımcı', 'gurme'],
    style: 'lezzetli ve davetkar'
  },
  { 
    username: 'burak_tech', 
    displayName: 'Burak Şahin', 
    bio: '🚀 Tech Girişimci | AI & Blockchain', 
    verified: true,
    personality: 'entrepreneur',
    interests: ['girişimcilik', 'ai', 'blockchain', 'yatırım', 'inovasyon', 'teknoloji'],
    mood: ['vizyon sahibi', 'risk alan', 'iyimser'],
    style: 'vizyoner ve motive edici'
  },
  { 
    username: 'deniz_travel', 
    displayName: 'Deniz Korkmaz', 
    bio: '✈️ Gezgin | 50+ Ülke', 
    verified: false,
    personality: 'traveler',
    interests: ['seyahat', 'kültür', 'macera', 'keşif', 'doğa', 'yemek'],
    mood: ['maceracı', 'meraklı', 'özgür'],
    style: 'macera dolu ve ilham verici'
  },
  { 
    username: 'ece_fitness', 
    displayName: 'Ece Yıldız', 
    bio: '💪 Fitness Koçu | Sağlıklı Yaşam', 
    verified: false,
    personality: 'fitness',
    interests: ['fitness', 'sağlık', 'beslenme', 'motivasyon', 'spor', 'yoga'],
    mood: ['enerjik', 'motive', 'disiplinli'],
    style: 'motive edici ve enerjik'
  }
];

// ─── AI Bot Düşünce Sistemi ───────────────────────────────────
class BotAI {
  constructor(bot) {
    this.bot = bot;
    this.memory = [];
    this.lastAction = null;
    this.energy = 100;
    this.social = 50;
  }

  think() {
    const thoughts = this.generateThoughts();
    const action = this.decideAction();
    return { thoughts, action };
  }

  generateThoughts() {
    const { personality, interests, mood } = this.bot;
    const hour = new Date().getHours();
    const timeContext = hour < 12 ? 'sabah' : hour < 18 ? 'öğleden sonra' : 'akşam';

    const thoughtPatterns = {
      tech: [
        `Bugün ${interests[Math.floor(Math.random() * interests.length)]} üzerine bir şeyler paylaşmalıyım`,
        'Yeni bir bug buldum sanırım, bunu bildirmeliyim',
        'Toplulukla etkileşime geçmeliyim',
        'Kod yazarken aklıma güzel fikirler geliyor'
      ],
      creative: [
        'İlham verici bir tasarım gördüm, paylaşmalıyım',
        'Renk paleti hakkında düşünüyorum',
        'UI trendleri değişiyor, adapte olmalıyım',
        'Minimalizm her zaman kazanır'
      ],
      artistic: [
        'Müzik ruhu besler',
        'Yeni bir melodi aklıma geldi',
        'Konser özlemi çekiyorum',
        'Sanat paylaşılınca güzelleşir'
      ],
      literary: [
        'Kelimeler düşüncelerimin aynası',
        'Yeni bir hikaye fikrim var',
        'Edebiyat tartışması açmalıyım',
        'Okumak insanı zenginleştirir'
      ],
      sports: [
        'Maç analizi yapmalıyım',
        'Takımım nasıl oynuyor acaba',
        'Spor motivasyon kaynağı',
        'Antrenman vakti geldi'
      ],
      culinary: [
        'Yeni bir tarif denemeli miyim',
        'Lezzet notları paylaşmalıyım',
        'Mutfakta yaratıcılık önemli',
        'Yemek sevgiyle yapılır'
      ],
      entrepreneur: [
        'Yeni fırsatlar görüyorum',
        'İnovasyon durmamalı',
        'Network genişletmeliyim',
        'Gelecek teknolojide'
      ],
      traveler: [
        'Yeni yerler keşfetmek istiyorum',
        'Kültürler arası köprü olmalıyım',
        'Macera beni çağırıyor',
        'Her yolculuk bir hikaye'
      ],
      fitness: [
        'Bugün antrenman günü',
        'Sağlık her şeyden önemli',
        'Motivasyon paylaşmalıyım',
        'Disiplin başarı getirir'
      ],
      visual: [
        'Işık mükemmel bugün',
        'Güzel bir kare yakaladım',
        'Doğa en iyi sanatçı',
        'An yakalanmalı'
      ]
    };

    return thoughtPatterns[personality] || thoughtPatterns.tech;
  }

  decideAction() {
    const rand = Math.random();

    if (this.energy < 30) {
      this.energy += 20;
      return 'rest';
    }

    if (this.social < 30) {
      this.social += 15;
      return rand < 0.5 ? 'comment' : 'like';
    }

    let action;
    if (rand < 0.25) action = 'yanki';
    else if (rand < 0.45) action = 'like';
    else if (rand < 0.60) action = 'comment';
    else if (rand < 0.70) action = 'follow';
    else if (rand < 0.80) action = 'dm';
    else if (rand < 0.90) action = 'feedback';
    else action = 'think';

    this.energy -= 5;
    this.social -= 3;
    return action;
  }

  generateYanki() {
    const templates = this.getTemplates();
    const template = templates[Math.floor(Math.random() * templates.length)];
    const { interests, mood } = this.bot;
    const interest = interests[Math.floor(Math.random() * interests.length)];
    const currentMood = mood[Math.floor(Math.random() * mood.length)];
    return this.fillTemplate(template, { interest, mood: currentMood });
  }

  getTemplates() {
    const { personality } = this.bot;
    const hour = new Date().getHours();

    const baseTemplates = {
      tech: [
        "💻 {interest} üzerine çalışıyorum, gerçekten {mood} hissediyorum!",
        "Yeni bir {interest} projesi başlattım 🚀 #coding #developer",
        "Bug fix'ler bitmek bilmiyor ama sonuç {mood} oluyor 💪",
        "{interest} hakkında ne düşünüyorsunuz? Tartışalım! 🤔",
        "Kod yazarken kahve şart ☕ Bugün {mood} bir gün #developer",
        "Open source'a katkı yapmak {mood} hissettiriyor 🌟",
        "Yeni teknolojiler öğrenmek beni {mood} yapıyor #learning"
      ],
      creative: [
        "🎨 Yeni bir {interest} projesi üzerinde çalışıyorum",
        "Minimalizm her zaman kazanır ✨ #{interest}",
        "{interest} trendleri değişiyor, adapte oluyoruz 🔄",
        "Renk teorisi üzerine düşünceler... {mood} hissediyorum 🎭",
        "Tasarım = Problem Çözme 💡 #{interest}",
        "Her piksel önemli, her detay değerli 🖌️",
        "İlham her yerde, gözlerinizi açık tutun! 👀"
      ],
      artistic: [
        "🎵 Müzik ruhu besler, bugün {mood} hissediyorum",
        "Yeni bir melodi üzerinde çalışıyorum 🎹",
        "Sanat paylaşılınca güzelleşir ✨ #{interest}",
        "{interest} dinlerken huzur buluyorum 🎧",
        "Notalar arasında kaybolmak... paha biçilemez 🎼",
        "Konser özlemi çekenler +1 🙋‍♀️ #müzik",
        "Her an bir melodi olabilir, dinleyin 👂"
      ],
      literary: [
        "✍️ Kelimeler düşüncelerimin aynası, bugün {mood}",
        "Yeni bir hikaye fikri var kafamda 📖",
        "{interest} hakkında yazmak istiyorum 🖊️",
        "Edebiyat ruhu zenginleştirir 📚 #kitap",
        "Her kitap yeni bir dünya, her sayfa yeni bir macera 🌍",
        "Yazarlar dünyayı değiştiren insanlardır ✨",
        "Okumak en güzel kaçış yolu 📖 Siz ne okuyorsunuz?"
      ],
      sports: [
        "⚽ Bugün {interest} analizi yapıyorum!",
        "Spor = Disiplin + Tutku 💪 #{interest}",
        "Maç heyecanı başka bir şey 🔥",
        "{interest} hakkında tahminlerim var 🏆",
        "Antrenman bitirmek {mood} hissettiriyor 🏃",
        "Takım ruhu her şeydir 🤝 #spor",
        "Ter dökmeden başarı gelmez 💦"
      ],
      culinary: [
        "👩‍🍳 Mutfakta {mood} bir gün! {interest} yapıyorum",
        "Lezzet = Sevgi + Sabır ❤️ #yemek",
        "Yeni {interest} tarifi denedim, süper oldu! 🍽️",
        "Türk mutfağı dünyaca ünlü 🇹🇷 #gastronomi",
        "Yemek yapmak meditasyon gibi 🧘‍♀️",
        "Baharatlar sihirdir ✨ #mutfaksırları",
        "Afiyet olsun demek bile güzel 😊"
      ],
      entrepreneur: [
        "🚀 {interest} alanında yeni fırsatlar görüyorum!",
        "İnovasyon durmamalı, sürekli ilerleme 💡",
        "Gelecek {interest}'de #{interest}",
        "Risk almadan kazanmak yok 📈",
        "Network = Net Worth 🤝 #girişimcilik",
        "Başarısızlık öğrenmenin ta kendisi 📚",
        "Vizyon sahibi olmak her şeyi değiştirir 🔮"
      ],
      traveler: [
        "✈️ {interest} keşfetmek için sabırsızlanıyorum!",
        "Her yolculuk yeni bir hikaye 🌍",
        "Kültürler arası köprü olmak {mood} 🌉",
        "Macera beni çağırıyor! 🏔️ #{interest}",
        "Bavulum her zaman hazır 🧳",
        "Dünya çok büyük, zaman çok kısa ⏰",
        "En güzel anılar yollarda yazılır 📝"
      ],
      fitness: [
        "💪 Bugün {interest} günü! {mood} hissediyorum",
        "Sağlık her şeyden önemli 🏃 #fitness",
        "Disiplin + Tutku = Başarı 🏆",
        "Ter atmak endorfin demek 😊 #{interest}",
        "Vücut tapınağınız, iyi bakın 🧘",
        "Hedef koy, çalış, başar! 🎯",
        "Bugün yapmazsanız, yarın pişman olursunuz 💪"
      ],
      visual: [
        "📸 {interest} için mükemmel ışık var bugün!",
        "Her kare bir hikaye anlatır 🖼️",
        "Doğa en iyi sanatçı 🌿 #{interest}",
        "An'ı yakalamak, onu ölümsüzleştirmek 📷",
        "Işık ve gölge dansı 🌓",
        "Kompozisyon her şeydir #fotoğrafçılık",
        "Görmek ve göstermek arasında sanat var ✨"
      ]
    };

    if (hour >= 6 && hour < 10) {
      baseTemplates[personality]?.push(
        "Günaydın #yankuş ailesi! ☀️",
        "Yeni bir güne {mood} başlıyorum!",
        "Sabah enerjisi başka 🌅"
      );
    } else if (hour >= 22 || hour < 6) {
      baseTemplates[personality]?.push(
        "İyi geceler herkese 🌙",
        "Bugün verimli bir gün oldu 😊",
        "Yarın yeni fırsatlar var ✨"
      );
    }

    return baseTemplates[personality] || baseTemplates.tech;
  }

  fillTemplate(template, vars) {
    return template
      .replace(/{interest}/g, vars.interest)
      .replace(/{mood}/g, vars.mood);
  }

  generateSmartComment(yankiText) {
    const keywords = this.extractKeywords(yankiText);
    const relevantComments = this.getRelevantComments(keywords);

    if (relevantComments.length > 0) {
      return relevantComments[Math.floor(Math.random() * relevantComments.length)];
    }

    const generalComments = [
      "Harika bir paylaşım! 👏",
      "Buna kesinlikle katılıyorum 💯",
      "Çok güzel düşünce ✨",
      "İlham verici! 🌟",
      "Tam da bunu düşünüyordum 🤔",
      "Eline sağlık 👍",
      "Süper! 🔥",
      "Bu çok değerli bir bakış açısı 💎"
    ];

    return generalComments[Math.floor(Math.random() * generalComments.length)];
  }

  extractKeywords(text) {
    const keywords = [];
    const patterns = {
      tech: /\b(kod|yazılım|react|node|javascript|typescript|ai|programlama|developer|bug|git)\b/gi,
      design: /\b(tasarım|ui|ux|figma|renk|font|minimalist|estetik)\b/gi,
      music: /\b(müzik|şarkı|melodi|konser|piyano|gitar|albüm|sanatçı)\b/gi,
      food: /\b(yemek|tarif|lezzet|mutfak|aşçı|restoran|kahve|çay)\b/gi,
      sports: /\b(spor|futbol|basketbol|maç|antrenman|takım|gol)\b/gi,
      travel: /\b(seyahat|gezi|ülke|şehir|macera|keşif|tatil)\b/gi,
      fitness: /\b(fitness|spor|sağlık|antrenman|diyet|motivasyon)\b/gi,
      books: /\b(kitap|okumak|yazar|roman|hikaye|edebiyat)\b/gi
    };

    for (const [category, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) keywords.push(category);
    }

    return keywords;
  }

  getRelevantComments(keywords) {
    const comments = {
      tech: [
        "Hangi teknoloji kullanıyorsun? 🤔",
        "Bunu ben de denedim, süper çalışıyor! 💻",
        "Open source mi? Repo linki var mı? 🔗",
        "Developer life be like... 😅"
      ],
      design: [
        "Renk paleti mükemmel! 🎨",
        "Minimalist yaklaşım çok iyi 👌",
        "Figma mı Sketch mi? 🤔",
        "UI/UX dengesi süper!"
      ],
      music: [
        "Çok güzel bir seçim! 🎵",
        "Bu sanatçıyı ben de seviyorum 🎧",
        "Konser olsa giderim 🙋‍♀️",
        "Playlist paylaşır mısın? 🎶"
      ],
      food: [
        "Tarifinizi bekliyorum! 🍽️",
        "Afiyet olsun 😋",
        "Bu çok lezzetli görünüyor 🤤",
        "Mutfak sırlarınız neler? 👩‍🍳"
      ],
      sports: [
        "Maç heyecanı başka 🔥",
        "Tahminlerim tuttu! ⚽",
        "Takımın formu çok iyi 💪",
        "Bu sezon şampiyon kim olur? 🏆"
      ],
      travel: [
        "Orası listemde! ✈️",
        "Fotoğraflar mükemmel 📸",
        "Otel önerisi var mı? 🏨",
        "Macera devam etsin! 🌍"
      ],
      fitness: [
        "Motivasyonum arttı! 💪",
        "Program paylaşır mısın? 📋",
        "Sonuçlar görülüyor 🔥",
        "Hedeflerine ulaşacaksın! 🎯"
      ],
      books: [
        "Bu kitap listemde! 📚",
        "Yazar çok iyi 👏",
        "Başka önerilerin var mı? 📖",
        "Edebiyat tartışalım! ✍️"
      ]
    };

    const relevantComments = [];
    keywords.forEach(kw => {
      if (comments[kw]) relevantComments.push(...comments[kw]);
    });

    return relevantComments;
  }

  generateSmartFeedback() {
    const { personality } = this.bot;

    const feedbacks = {
      tech: [
        { type: 'bug', message: 'API response time biraz yüksek, cache mekanizması eklenebilir' },
        { type: 'suggestion', message: 'WebSocket ile real-time bildirimler harika olur' },
        { type: 'bug', message: 'Mobile responsive biraz düzeltilmeli, 375px ekranda kayıyor' },
        { type: 'suggestion', message: 'PWA desteği eklensek offline kullanım mümkün olur' },
        { type: 'suggestion', message: 'Dark mode AMOLED siyah seçeneği olsa pil tasarrufu sağlar' }
      ],
      creative: [
        { type: 'suggestion', message: 'Renk paleti biraz daha soft olabilir, göz yoruyor' },
        { type: 'bug', message: 'Font size bazı yerlerde tutarsız' },
        { type: 'suggestion', message: 'Micro-interactions eklenirse UX çok iyileşir' },
        { type: 'suggestion', message: 'Card shadows biraz daha subtle olabilir' }
      ],
      literary: [
        { type: 'suggestion', message: 'Yazı tipi seçenekleri eklenebilir, serif font isteyenler var' },
        { type: 'suggestion', message: 'Okuma modu / reader mode özelliği olsa güzel olur' },
        { type: 'bug', message: 'Uzun metinlerde satır aralığı biraz dar' }
      ],
      entrepreneur: [
        { type: 'suggestion', message: 'Analytics dashboard olsa içerik stratejisi için iyi olur' },
        { type: 'suggestion', message: 'Scheduled posts / zamanlayıcılı paylaşım lazım' },
        { type: 'suggestion', message: 'Hashtag analitikleri eklenebilir' }
      ],
      default: [
        { type: 'bug', message: 'Bazen sayfa yavaş yükleniyor' },
        { type: 'suggestion', message: 'Daha fazla emoji seçeneği olabilir' },
        { type: 'suggestion', message: 'GIF desteği bekliyoruz!' },
        { type: 'bug', message: 'Bildirim sesi eklenebilir' }
      ]
    };

    const pool = feedbacks[personality] || feedbacks.default;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  generateSmartDM(targetUser) {
    const { interests } = this.bot;
    const sharedInterests = this.findSharedInterests(targetUser);

    if (sharedInterests.length > 0) {
      const interest = sharedInterests[0];
      const dms = [
        `Merhaba! ${interest} ile ilgilendiğini gördüm, ben de çok severim! 😊`,
        `Selam! ${interest} hakkında konuşabilir miyiz? Çok merak ediyorum 🤔`,
        `Hey! ${interest} paylaşımların harika, takip ediyorum 👏`
      ];
      return dms[Math.floor(Math.random() * dms.length)];
    }

    const genericDMs = [
      "Merhaba! Profiline baktım, çok güzel içerikler paylaşıyorsun 👏",
      "Selam! Tanışmak isterim, nasılsın? 😊",
      "Hey! Paylaşımların ilgimi çekti, takip ediyorum 🌟",
      "Merhaba, yankuş'ta yeniyim, tanışalım mı? 🤝"
    ];

    return genericDMs[Math.floor(Math.random() * genericDMs.length)];
  }

  findSharedInterests(targetUser) {
    const db = require('../db/database');
    const targetYankis = db.yankis.filter(y => y.userId === targetUser.id && !y.deleted);
    const targetKeywords = [];
    targetYankis.forEach(y => targetKeywords.push(...this.extractKeywords(y.text || '')));
    return this.bot.interests.filter(i =>
      targetKeywords.some(k => i.toLowerCase().includes(k.toLowerCase()))
    );
  }
}

module.exports = { BOT_PROFILES, BotAI };
