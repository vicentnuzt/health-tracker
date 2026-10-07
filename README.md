# Sổ Cân Nặng ⚡

App cá nhân lấy **tập luyện** làm trọng tâm, kèm theo dõi cân nặng và tra cứu dinh dưỡng. Lần đầu mở, app hỏi một bảng khảo sát rồi tự lập lịch tập theo dụng cụ bạn có, cùng các quy tắc riêng cho bạn. Không cần AI, không cần mạng (font chữ tải từ Google Fonts; khi không có mạng sẽ dùng font hệ thống).

**Cách dùng trên máy tính:** mở `index.html` bằng Chrome hoặc Edge.

**Cách dùng trên iPhone:**
1. Mở link GitHub Pages bằng **Safari**.
2. Bấm **Chia sẻ** → **Thêm vào Màn hình chính**.

App sẽ chạy toàn màn hình và dùng được khi không có mạng.

Dữ liệu chỉ lưu trên thiết bị đang dùng (iPhone và máy tính không tự đồng bộ với nhau), nên thỉnh thoảng hãy vào **Cài đặt → Xuất file sao lưu**.

## Đưa lên GitHub Pages

1. Tạo repo mới trên github.com (ví dụ `so-can-nang`, chế độ Public).
2. Đẩy code lên:
   ```bash
   git remote add origin https://github.com/<tên-github>/so-can-nang.git
   git push -u origin main
   ```
3. Bật Pages: vào repo → **Settings → Pages**, mục **Source** chọn **Deploy from a branch**, chọn **main** và **/ (root)**, rồi bấm **Save**.
4. Sau 1–2 phút, app có ở `https://<tên-github>.github.io/so-can-nang/`.

**Khi sửa code:** tăng số phiên bản `CACHE` trong `sw.js` (ví dụ `scn-app-v6` → `scn-app-v7`), rồi commit và push. iPhone sẽ tự tải bản mới ở lần mở app tiếp theo khi có mạng.

## Tính năng chính

- **Khảo sát 7 bước:** cơ thể, sinh hoạt, sức khỏe, tập luyện (kể cả những ngày bạn rảnh), ăn uống, thói quen, mục tiêu (kèm vùng muốn cải thiện).
- **Lịch tập theo chu kỳ 12 tuần:** mỗi tuần có mục tiêu cụ thể và mức gắng sức (RIR). Mỗi bài đều có gợi ý bài dễ hơn và khó hơn cùng nhóm cơ.
- **Chế độ tập:** Chuẩn bị → Khởi động → (Tập hiệp ↔ Nghỉ) → Thả lỏng → Tổng kết.
  - hỏi cảm giác hôm nay (mệt thì tự bớt hiệp);
  - **ghi kg × số lần mỗi hiệp**, app tự gợi ý mức tạ buổi sau (tăng tiến kép) và báo 🏆 kỷ lục;
  - **nhạc tự tạo** (điện tử, hip-hop, lo-fi) đổi nhịp theo giai đoạn, hoặc mở playlist riêng;
  - **giọng HLV tiếng Việt** đọc tên bài, hiệp, giờ nghỉ, đếm ngược 3-2-1;
  - hướng dẫn kỹ thuật (cách thở, lỗi thường gặp, link video), đổi bài dễ hơn / khó hơn;
  - bấm giờ bài giữ tư thế, cardio biến tốc theo từng block, đánh giá độ nặng sau buổi tập.
- **Dinh dưỡng:** tra cứu calo và đạm của ~130 món Việt (gõ không dấu cũng được), nhãn ✅ nên ăn / ⚠️ hạn chế kèm gợi ý thay thế, bấm + để ghi vào nhật ký.
- **Tiến độ:** lịch sử buổi tập, khối lượng đã nâng, kỷ lục cá nhân từng bài, biểu đồ cân nặng.
- **HLV nhận xét theo nhật ký:** số buổi đã tập, ăn vượt hoặc thiếu, đạm thấp, ăn nhiều cuối tuần, cân đứng yên hoặc giảm quá nhanh, lâu chưa cân, uống ít nước, chuỗi ngày ghi chép.
- **Tự hiệu chỉnh calo:** dựa trên lượng ăn thực tế và xu hướng cân nặng.

## Cấu trúc

```
index.html          Khung giao diện + CSS
app.js              Khảo sát và các tab (Hôm nay, Lịch tập, Dinh dưỡng, Tiến độ, Cài đặt)
player.js           Chế độ tập: đếm hiệp, ghi kg × lần, đồng hồ nghỉ, kỷ lục, tổng kết
audio.js            Nhạc tự tạo bằng Web Audio, giọng HLV tiếng Việt, tiếng bíp
engine.js           Bộ máy phân tích: tính calo, chọn bài, gợi ý tăng tạ, phân loại món ăn, đọc nhật ký, áp dụng quy tắc
brain/              "Bộ não huấn luyện viên", chỉ chứa dữ liệu, sửa được mà không cần đụng code
  exercises.js      132 bài tập: nhóm chuyển động, dụng cụ, độ khó, nhóm cơ, chống chỉ định, hướng dẫn thở / lỗi thường gặp
  programs.js       Giáo án: chia buổi, vùng cải thiện, số hiệp/lần/nghỉ, chu kỳ 12 tuần, bước chân, cardio
  nutrition.js      Bảng món Việt: calo, đạm, nhãn chay / dị ứng, nhãn nên ăn / hạn chế, gợi ý thay thế
  rules.js          119 quy tắc: điều kiện → lời khuyên (an toàn, phân tích, HLV nhận xét, tập, ăn, thói quen…)
```

## Cách "bộ não" ra quyết định

1. **Năng lượng:** dùng công thức Mifflin-St Jeor nhân với hệ số vận động, cộng calo của các buổi trong lịch tập.
   - Phần thâm hụt được giới hạn ở 25% TDEE, và calo không bao giờ xuống dưới mức an toàn.
   - Nếu mức an toàn đã gần bằng mức tiêu hao, app khuyên tăng vận động thay vì ăn ít hơn.
   - Calo được chia lại theo ngày: ngày tập ăn nhiều hơn, ngày nghỉ ăn ít hơn.
2. **Lịch tập:**
   - Ngày tập được xếp cách đều trong những ngày bạn rảnh.
   - Mỗi buổi gồm bài chính đa khớp trước, sau đó là bài thăng bằng (từ 55 tuổi) và bài cho vùng muốn cải thiện.
   - App loại các bài có chống chỉ định: đau gối, lưng, vai, huyết áp, tim mạch, mang thai, người từ 60 tuổi.
   - Giai đoạn "Tăng tốc" tự chuyển sang biến thể bài khó hơn.
3. **Tăng tiến:** khi mọi hiệp đạt số lần tối đa, buổi sau tăng tạ (tạ đơn +1 kg, tạ đòn / máy +2,5 kg) hoặc gợi ý bài khó hơn; chưa đạt thì giữ mức tạ và cố thêm 1 lần. Kỷ lục tính theo 1RM ước tính (công thức Epley).
4. **Món ăn:** tự xếp ⚠️ hạn chế nếu đồ uống nhiều đường, món ≥ 600 kcal mà ít đạm, hoặc nhiều dầu mỡ; ✅ nên ăn nếu giàu đạm, cân bằng, hoặc rau / trái cây ít calo.
5. **HLV nhận xét:** `ENGINE.review()` đọc nhật ký 7–14 ngày gần nhất, các quy tắc nhóm `coach` sẽ phản hồi theo đó.

## Mở rộng

- **Thêm bài tập:** thêm một dòng `E('id', 'slot', 'Tên', 'equip', lvl, ['avoid'], 'Lưu ý', {m: 'Nhóm cơ'})` vào `brain/exercises.js`. Bài dễ hơn và khó hơn được tự suy ra từ độ khó.
- **Thêm món ăn:** thêm một dòng `F(...)` vào `BRAIN.FOOD_DB` trong `brain/nutrition.js`. Nhãn nên ăn / hạn chế được tự xếp, hoặc ghi rõ kèm gợi ý thay thế.
- **Thêm kinh nghiệm:** thêm `R('nhóm', ưu_tiên, (p, c) => điều_kiện, 'lời khuyên')` vào `brain/rules.js`.

Kế hoạch chỉ mang tính tham khảo, không thay thế tư vấn của bác sĩ hay huấn luyện viên.
