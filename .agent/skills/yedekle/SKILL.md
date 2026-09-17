---
name: yedekle
description: Projenin anlık yedeğini alarak 'yedekler' klasöründe tarih-saat damgasıyla saklar.
allowed-tools: Read, Write, Edit, RunCommand
version: 1.0
priority: NORMAL
---

# Yedekle - Proje Yedekleme Yeteneği

> **GÖREV:** İçinde bulunulan projenin güncel dosyalarını, ana klasörde yer alan `yedekler` klasörüne proje adı ve tarih-saat bilgisiyle kopyalamak.

---

## 🛠 Görev Kuralları ve İşleyiş

Çalıştırıldığında izlenecek aşamalar:
1. **Ana ve Proje Klasörünün Belirlenmesi:** Çalışılan mevcut projenin adı tespit edilir ve bir üst dizinin ana klasör olduğu varsayılır.
2. **Hedef Dizinlerin Oluşturulması:** Ana klasör altına `yedekler` klasörü ve onun da içine proje adında bir klasör oluşturulur.
3. **Zaman Damgası:** Anlık tarih ve saat (Örn: `2026-02-28_16-30-00`) alınarak projeye özel yedek klasörünün içinde yeni bir klasör oluşturulur.
4. **Kopyalama:** Proje içerisindeki dizin ve dosyalar hedef klasöre kopyalanır (`node_modules`, `.git` vb. gereksiz büyük boyutlu dosyalar atlanabilir).
5. **Sonuç Bildirimi:** Kopyalama bittiğinde ekrana / kullanıcıya `✅ Yedekleme başarıyla tamamlandı` veya benzeri bir başarı mesajı gösterilir.

---

## 🏃 Script Kullanımı

Yedekleme işlemi için Python scripti hazırlanmıştır ve her projede hızlıca çalıştırılabilir.

| Komut | Açıklama |
|-------|----------|
| `python ../.agent/skills/yedekle/scripts/yedekle.py .` | İçinde bulunulan projeyi yedekler. |

> `yedekle.py` scripti çağırıldığında işlem kendi kendine tamamlanacak ve sonucu çıktı olarak verecektir.

---

## 🔴 Kurallar (MANDATORY)

- Yedekleme işlemi sırasında projeye zarar verilmeyecek ve orijinal proje içerisinde değişiklik yapılmayacaktır. Sadece kopyalama yapılmalıdır.
- Kullanıcı sadece `yedekle` komutu verdiğinde bile sistem otomatik olarak hangi projede olduğunu bulup o projeyi yedeklemelidir.
- Yedekleme onay almadan doğrudan güvenli olarak yapılmalıdır.
