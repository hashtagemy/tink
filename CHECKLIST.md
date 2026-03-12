# Tink — Hackathon Checklist

**Hackathon:** Gemini Live Agent Challenge
**Kategori:** Live Agents
**Deadline:** 17 Mart 2026, 03:00 (GMT+3)

---

## Zorunlu Gereksinimler

### Teknik Gereksinimler
- [x] Gemini model kullanımı (Gemini 2.5 Flash — Native Audio + Text)
- [x] Google GenAI SDK veya ADK kullanımı (her ikisi de mevcut)
- [x] En az bir Google Cloud servisi (Cloud Run)

### Kategori Gereksinimleri (Live Agents)
- [x] Gemini Live API veya ADK kullanımı
- [x] Google Cloud üzerinde host edilmiş backend
- [x] Gerçek zamanlı sesli etkileşim (konuşma + dinleme)
- [x] Barge-in (araya girme) desteği

### Submission Gereksinimleri
- [x] Text Description — Proje özeti, özellikler, teknolojiler, bulgular
- [x] Public Code Repository URL (GitHub)
- [x] README'de spin-up talimatları
- [x] Google Cloud Deployment kanıtı (live.py dosya linki + Cloud Run deploy)
- [x] Architecture Diagram (3 adet PNG — ana mimari, sequence, state)
- [ ] Demo Video (<4 dakika) — Multimodal/agentic özelliklerin canlı çalışması + pitch

---

## Bonus Puanlar

- [ ] İçerik yayını (blog/podcast/video) — #GeminiLiveAgentChallenge hashtag'i ile
- [x] Otomatik Cloud Deployment scripti (`deploy.sh` — repo'da mevcut)
- [x] Google Developer Group üyeliği + profil linki

---

## Jüri Kriterleri Durumu

### Innovation & Multimodal UX (%40)
- [x] "Text box" paradigmasını kırıyor (tamamen ses-öncelikli)
- [x] Belirgin persona/ses ("Kore" sesi, Tink maskotu)
- [x] Canlı ve bağlamsal deneyim (real-time, barge-in)
- [x] See, Hear, Speak deneyimi (Hear+Speak tam, See=flashcard/quiz)

### Technical Implementation (%30)
- [x] GenAI SDK / ADK etkin kullanımı (tool calling, session state, Live API)
- [x] Google Cloud üzerinde hosting (Cloud Run — aktif)
- [x] Agent mantığı (dinamik instruction, state tracking, tool'lar)
- [x] Hata yönetimi (audio gating, reconnect, fallback)
- [x] Grounding / Halüsinasyon önleme (Google Search Grounding — müfredat oluşturmada)

### Demo & Presentation (%30)
- [x] Mimari diyagram
- [x] Cloud deployment kanıtı
- [ ] Video — problem ve çözüm tanımı
- [ ] Video — yazılımın canlı çalıştığının gösterimi
