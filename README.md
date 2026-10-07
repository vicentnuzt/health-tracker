# Sổ Cân Nặng ⚡

App cá nhân theo dõi ăn uống, cân nặng và tập luyện. Lần đầu mở, app hỏi một bảng khảo sát rồi tự lập lịch tập, thực đơn và quy tắc riêng cho bạn. Không cần AI, không cần mạng (font chữ tải từ Google Fonts; khi không có mạng sẽ dùng font hệ thống).

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

**Khi sửa code:** tăng số phiên bản `CACHE` trong `sw.js` (ví dụ `scn-app-v4` → `scn-app-v5`), rồi commit và push. iPhone sẽ tự tải bản mới ở lần mở app tiếp theo khi có mạng.

## Tính năng chính

- **Khảo sát 7 bước:** cơ thể, sinh hoạt, sức khỏe, tập luyện (kể cả những ngày bạn rảnh), ăn uống, thói quen, mục tiêu (kèm vùng muốn cải thiện).
- **Lịch tập theo chu kỳ 12 tuần:** mỗi tuần có mục tiêu cụ thể và mức gắng sức (RIR). Mỗi bài đều có gợi ý bài dễ hơn và khó hơn cùng nhóm cơ.
- **Chế độ tập:**
  - đếm hiệp;
  - đồng hồ nghỉ có tiếng bíp và rung;
  - bấm giờ cho bài giữ tư thế;
  - hẹn giờ cho cardio biến tốc theo từng block;
  - đổi bài ngay khi đang tập;
  - lưu buổi tập vào nhật ký.
- **Thực đơn 7 ngày** bằng món Việt:
  - ngày tập ăn nhiều hơn ngày nghỉ;
  - gợi ý ăn trước và sau tập;
  - mẹo gọi món khi ăn ngoài;
  - nhắc bổ sung khi còn thiếu đạm.
- **HLV nhận xét theo nhật ký:** số buổi đã tập, ăn vượt hoặc thiếu, đạm thấp, ăn nhiều cuối tuần, cân đứng yên hoặc giảm quá nhanh, lâu chưa cân, uống ít nước, chuỗi ngày ghi chép.
- **Tự hiệu chỉnh calo:** dựa trên lượng ăn thực tế và xu hướng cân nặng.

## Cấu trúc

```
index.html          Khung giao diện + CSS
app.js              Khảo sát, nhật ký, kế hoạch, chế độ tập
engine.js           Bộ máy phân tích: tính calo, chọn bài, lập thực đơn, đọc nhật ký, áp dụng quy tắc
brain/              "Bộ não huấn luyện viên", chỉ chứa dữ liệu, sửa được mà không cần đụng code
  exercises.js      125 bài tập: nhóm chuyển động, dụng cụ, độ khó, nhóm cơ, chống chỉ định
  programs.js       Giáo án: chia buổi, vùng cải thiện, số hiệp/lần/nghỉ, chu kỳ 12 tuần, bước chân, cardio
  nutrition.js      Món Việt (calo, đạm, nhãn chay/dị ứng/giá, mẹo gọi món), cách chia bữa, ăn quanh giờ tập
  rules.js          114 quy tắc: điều kiện → lời khuyên (an toàn, phân tích, HLV nhận xét, tập, ăn, thói quen…)
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
3. **Thực đơn:** lọc món theo chế độ ăn, món dị ứng, ngân sách và việc có tự nấu không. Mỗi bữa chọn món gần với calo của bữa và đủ đạm, không lặp món trong cùng ngày, và thêm món phụ nếu còn thiếu.
4. **HLV nhận xét:** `ENGINE.review()` đọc nhật ký 7–14 ngày gần nhất, các quy tắc nhóm `coach` sẽ phản hồi theo đó.

## Mở rộng

- **Thêm bài tập:** thêm một dòng `E('id', 'slot', 'Tên', 'equip', lvl, ['avoid'], 'Lưu ý', {m: 'Nhóm cơ'})` vào `brain/exercises.js`. Bài dễ hơn và khó hơn được tự suy ra từ độ khó.
- **Thêm món ăn:** thêm một dòng vào `BRAIN.DISHES` trong `brain/nutrition.js`. Cột cuối là mẹo gọi món (không bắt buộc).
- **Thêm kinh nghiệm:** thêm `R('nhóm', ưu_tiên, (p, c) => điều_kiện, 'lời khuyên')` vào `brain/rules.js`.

Kế hoạch chỉ mang tính tham khảo, không thay thế tư vấn của bác sĩ hay huấn luyện viên.
