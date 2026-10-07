/* =====================================================================
   BỘ NÃO · DINH DƯỠNG
   Giá trị là ước tính cho 1 phần thông thường ở Việt Nam.
   diet : omni (có thịt/cá) | veg (chay, có trứng/sữa) | vegan (thuần chay)
   tags : thành phần dễ dị ứng / kiêng: seafood dairy egg nuts gluten beef pork
   cost : 1 rẻ (< 35k) | 2 vừa (35–60k) | 3 cao (> 60k)
   meal : b = bữa sáng, m = bữa trưa/tối, bm = cả hai
   src  : out = mua ngoài | home = tự nấu
   tip  : mẹo gọi món / chế biến để nhẹ calo hơn (không bắt buộc)
   ===================================================================== */
window.BRAIN = window.BRAIN || {};

// Danh sách tra cứu nhanh khi ghi nhật ký: [tên, khẩu phần, kcal, đạm, tinh bột, béo]
BRAIN.FOODS = [
  ['Phở bò', '1 tô', 450, 25, 60, 12], ['Phở gà', '1 tô', 420, 25, 58, 9], ['Bún bò Huế', '1 tô', 500, 25, 65, 15],
  ['Bún chả', '1 phần', 550, 25, 65, 20], ['Bún thịt nướng', '1 tô', 520, 24, 65, 17], ['Bún riêu', '1 tô', 420, 18, 55, 12],
  ['Bún đậu mắm tôm', '1 mẹt', 650, 28, 70, 28], ['Hủ tiếu', '1 tô', 430, 22, 60, 10], ['Bánh canh', '1 tô', 450, 18, 65, 12],
  ['Mì Quảng', '1 tô', 480, 24, 62, 14], ['Miến gà', '1 tô', 400, 24, 55, 8],
  ['Cơm tấm sườn', '1 đĩa', 650, 30, 80, 22], ['Cơm gà', '1 đĩa', 600, 32, 78, 16], ['Cơm văn phòng (1 mặn 1 rau)', '1 phần', 600, 28, 80, 18],
  ['Cơm chiên', '1 đĩa', 700, 20, 90, 28], ['Cơm trắng', '1 chén (150g)', 200, 4, 45, 0.4], ['Cơm gạo lứt', '1 chén (150g)', 180, 4, 38, 1.5],
  ['Bánh mì thịt', '1 ổ', 400, 18, 50, 14], ['Bánh mì trứng', '1 ổ', 380, 15, 45, 15], ['Xôi gà', '1 gói', 500, 20, 70, 15],
  ['Xôi đậu xanh', '1 gói', 400, 10, 75, 6], ['Bánh cuốn', '1 đĩa', 380, 14, 55, 11], ['Gỏi cuốn', '1 cuốn', 65, 3.5, 9, 1],
  ['Cháo gà', '1 tô', 320, 20, 42, 7], ['Mì gói', '1 gói', 350, 7, 48, 14], ['Bánh bao nhân thịt', '1 cái', 300, 11, 40, 10],
  ['Ức gà (chín)', '100g', 165, 31, 0, 3.6], ['Thịt heo nạc', '100g', 143, 21, 0, 6], ['Thịt bò nạc', '100g', 180, 26, 0, 8],
  ['Cá hồi', '100g', 208, 20, 0, 13], ['Cá basa', '100g', 120, 18, 0, 5], ['Tôm', '100g', 100, 24, 0, 0.3],
  ['Đậu hũ', '100g', 76, 8, 1.9, 4.8], ['Tempeh', '100g', 190, 19, 9, 11], ['Đậu nành Nhật (edamame)', '100g', 120, 11, 9, 5],
  ['Trứng gà', '1 quả', 75, 6, 0.6, 5], ['Rau luộc / xào ít dầu', '1 đĩa', 60, 3, 8, 2],
  ['Khoai lang', '100g', 86, 1.6, 20, 0.1], ['Yến mạch', '40g', 150, 5, 27, 2.5], ['Bắp luộc', '1 trái', 180, 5, 40, 2],
  ['Chuối', '1 quả', 105, 1.3, 27, 0.4], ['Táo', '1 quả', 95, 0.5, 25, 0.3], ['Xoài', '1 quả', 200, 2.8, 50, 1.3], ['Ổi', '1 quả', 70, 2.6, 15, 1],
  ['Sữa tươi không đường', '220ml', 140, 7, 10, 8], ['Sữa chua không đường', '1 hũ', 60, 4, 6, 2], ['Sữa chua Hy Lạp', '1 hũ 100g', 100, 10, 4, 4],
  ['Sữa đậu nành không đường', '1 hộp', 110, 7, 8, 5], ['Whey protein', '1 muỗng', 120, 24, 3, 1.5], ['Hạt điều / hạnh nhân', '30g', 170, 5, 9, 14],
  ['Cà phê đen không đường', '1 ly', 5, 0.3, 0, 0], ['Cà phê sữa đá', '1 ly', 150, 2, 25, 4], ['Bạc xỉu', '1 ly', 200, 4, 30, 7],
  ['Trà sữa trân châu', '1 ly size M', 350, 3, 60, 10], ['Nước ngọt có ga', '1 lon', 140, 0, 39, 0], ['Bia', '1 lon 330ml', 145, 1.6, 13, 0],
  ['Bánh tráng trộn', '1 bịch', 350, 6, 55, 12], ['Bánh flan', '1 cái', 130, 4, 20, 4], ['Chè', '1 ly', 300, 5, 60, 5]
];

const _dish = ([n, kcal, p, c, f, meal, src, diet, tags, cost, tip]) => ({n, kcal, p, c, f, meal, src, diet, tags, cost, tip: tip || ''});
BRAIN.DISHES = [
  // ---- Bữa sáng · mua ngoài ----
  ['Phở bò', 450, 25, 60, 12, 'bm', 'out', 'omni', ['beef'], 2, 'Xin ít bánh, thêm rau và giá, chừa lại nước béo'],
  ['Phở gà', 420, 25, 58, 9, 'bm', 'out', 'omni', [], 2, 'Gọi thêm thịt gà thay vì thêm bánh'],
  ['Bún bò Huế', 500, 25, 65, 15, 'bm', 'out', 'omni', ['beef', 'pork'], 2, 'Bỏ chả và giò heo, xin ít bún'],
  ['Bánh mì trứng ốp la', 380, 15, 45, 15, 'b', 'out', 'veg', ['egg', 'gluten'], 1, 'Ít bơ, ít pate, thêm dưa leo'],
  ['Bánh mì gà xé', 400, 22, 48, 12, 'b', 'out', 'omni', ['gluten'], 1, 'Ít sốt mayonnaise'],
  ['Xôi gà', 500, 20, 70, 15, 'b', 'out', 'omni', [], 1, 'Xin nửa phần xôi, giữ nguyên phần gà'],
  ['Bánh cuốn chả', 380, 14, 55, 11, 'b', 'out', 'omni', ['pork'], 1, 'Chấm ít nước mắm, ăn kèm nhiều rau'],
  ['Cháo gà', 320, 20, 42, 7, 'bm', 'out', 'omni', [], 1, 'Không ăn kèm quẩy'],
  ['Hủ tiếu Nam Vang', 430, 22, 60, 10, 'bm', 'out', 'omni', ['pork', 'seafood'], 2, 'Gọi khô, nước để riêng, xin thêm rau'],
  ['Bún riêu cua', 420, 18, 55, 12, 'bm', 'out', 'omni', ['seafood', 'pork'], 1, 'Bỏ bớt mỡ hành trên mặt'],
  ['Xôi đậu xanh', 400, 10, 75, 6, 'b', 'out', 'vegan', [], 1, 'Ăn kèm 1 hộp sữa đậu nành để thêm đạm'],
  ['Bánh mì đậu hũ', 360, 14, 48, 11, 'b', 'out', 'vegan', ['gluten'], 1],
  ['Phở chay', 380, 14, 62, 8, 'bm', 'out', 'vegan', [], 1, 'Xin thêm đậu hũ'],
  ['Bún riêu chay', 380, 14, 58, 9, 'bm', 'out', 'vegan', [], 1],
  // ---- Bữa sáng · tự làm ----
  ['Yến mạch nấu sữa + chuối', 350, 14, 55, 8, 'b', 'home', 'veg', ['dairy'], 1],
  ['Yến mạch sữa đậu nành + chuối', 330, 13, 55, 7, 'b', 'home', 'vegan', [], 1],
  ['2 trứng ốp + 1 lát bánh mì + dưa leo', 300, 15, 25, 15, 'b', 'home', 'veg', ['egg', 'gluten'], 1],
  ['Khoai lang + 2 trứng luộc + sữa không đường', 390, 20, 40, 15, 'b', 'home', 'veg', ['egg', 'dairy'], 1],
  ['Sữa chua Hy Lạp + trái cây + hạt', 300, 18, 35, 9, 'b', 'home', 'veg', ['dairy', 'nuts'], 2],
  ['Bánh mì nguyên cám + bơ đậu phộng + chuối', 380, 12, 50, 14, 'b', 'home', 'vegan', ['nuts', 'gluten'], 1],
  ['Sinh tố whey + chuối + yến mạch', 380, 30, 50, 6, 'b', 'home', 'veg', ['dairy'], 3],
  ['Đậu hũ non + sữa đậu nành + chuối', 320, 16, 45, 8, 'b', 'home', 'vegan', [], 1],
  ['Bánh mì nguyên cám + đậu hũ áp chảo + cà chua', 340, 20, 40, 11, 'b', 'home', 'vegan', ['gluten'], 1],
  ['Trứng chiên rau củ (3 quả) + 1 lát bánh mì', 380, 22, 22, 22, 'b', 'home', 'veg', ['egg', 'gluten'], 1],
  ['Sinh tố đậu nành + yến mạch + chuối', 360, 20, 52, 8, 'b', 'home', 'vegan', [], 1],
  // ---- Bữa chính · mua ngoài ----
  ['Cơm gà xé + rau', 600, 32, 78, 16, 'm', 'out', 'omni', [], 2, 'Xin ít cơm, không lấy da gà'],
  ['Cơm tấm sườn (bỏ mỡ hành)', 620, 30, 80, 20, 'm', 'out', 'omni', ['pork'], 2, 'Bỏ mỡ hành, ít nước mắm, thêm dưa leo cà chua'],
  ['Cơm phần: cá kho + rau luộc + canh', 550, 28, 75, 13, 'm', 'out', 'omni', ['seafood'], 1, 'Không chan nước kho'],
  ['Cơm phần: thịt luộc + rau + canh', 560, 28, 75, 15, 'm', 'out', 'omni', ['pork'], 1],
  ['Cơm phần: đậu hũ sốt cà + rau', 500, 16, 75, 14, 'm', 'out', 'vegan', [], 1, 'Gọi thêm 1 phần đậu hũ'],
  ['Cơm phần: gà luộc + trứng + rau', 580, 38, 72, 15, 'm', 'out', 'omni', ['egg'], 1],
  ['Bún chả', 550, 25, 65, 20, 'm', 'out', 'omni', ['pork'], 2, 'Ăn nhiều rau, ít bún, ít nước chấm'],
  ['Bún thịt nướng', 520, 24, 65, 17, 'm', 'out', 'omni', ['pork', 'nuts'], 1, 'Bỏ chả giò, ít mỡ hành'],
  ['Mì Quảng gà', 480, 24, 62, 14, 'm', 'out', 'omni', ['nuts'], 2],
  ['Cơm chay thập cẩm', 520, 16, 80, 14, 'm', 'out', 'vegan', [], 1, 'Chọn món hấp, kho; tránh món chiên giòn'],
  ['Bún gà / miến gà', 420, 26, 55, 9, 'm', 'out', 'omni', [], 1],
  ['Gỏi cuốn tôm thịt (4 cuốn)', 260, 14, 38, 5, 'm', 'out', 'omni', ['seafood', 'pork'], 1, 'Chấm ít tương đậu phộng'],
  ['Lẩu nấm chay (1 phần)', 450, 18, 55, 16, 'm', 'out', 'vegan', [], 3],
  ['Cơm bò lúc lắc', 680, 35, 75, 24, 'm', 'out', 'omni', ['beef'], 3, 'Đổi khoai tây chiên sang salad'],
  ['Salad ức gà (quán healthy)', 420, 35, 25, 18, 'm', 'out', 'omni', ['nuts'], 3, 'Xin sốt để riêng, chấm vừa đủ'],
  ['Cơm gà nướng + salad', 560, 36, 70, 14, 'm', 'out', 'omni', [], 2],
  ['Bún đậu hũ chay + rau', 450, 20, 60, 13, 'm', 'out', 'vegan', [], 1],
  // ---- Bữa chính · tự nấu ----
  ['Cơm + ức gà áp chảo + rau luộc', 520, 40, 60, 10, 'm', 'home', 'omni', [], 1],
  ['Cơm + cá basa hấp + canh rau', 480, 30, 62, 10, 'm', 'home', 'omni', ['seafood'], 1],
  ['Cơm + thịt nạc kho + rau luộc', 540, 30, 62, 16, 'm', 'home', 'omni', ['pork'], 1],
  ['Cơm + bò xào rau cải', 560, 32, 60, 18, 'm', 'home', 'omni', ['beef'], 2],
  ['Cơm + tôm rim + rau luộc', 480, 30, 62, 9, 'm', 'home', 'omni', ['seafood'], 2],
  ['Cơm + trứng chiên ít dầu + canh rau', 480, 18, 62, 17, 'm', 'home', 'veg', ['egg'], 1],
  ['Cơm + đậu hũ sốt cà + rau luộc', 480, 18, 68, 14, 'm', 'home', 'vegan', [], 1],
  ['Cơm gạo lứt + tempeh + rau xào', 500, 25, 60, 16, 'm', 'home', 'vegan', [], 2],
  ['Bún gạo lứt + gà xé + rau sống', 450, 32, 55, 9, 'm', 'home', 'omni', [], 1],
  ['Khoai lang + ức gà + salad', 420, 38, 40, 10, 'm', 'home', 'omni', [], 1],
  ['Salad cá hồi + trứng', 450, 32, 12, 30, 'm', 'home', 'omni', ['seafood', 'egg'], 3],
  ['Canh chua cá + rau + ít cơm', 400, 28, 40, 12, 'm', 'home', 'omni', ['seafood'], 1],
  ['Đậu lăng hầm rau củ + cơm', 450, 20, 70, 8, 'm', 'home', 'vegan', [], 1],
  ['Ức gà xào nấm + bông cải (ít cơm)', 380, 38, 20, 14, 'm', 'home', 'omni', [], 1],
  ['Đậu hũ nhồi thịt sốt cà + cơm', 520, 26, 62, 18, 'm', 'home', 'omni', ['pork'], 1],
  ['Cháo yến mạch thịt bằm + rau', 380, 24, 45, 10, 'm', 'home', 'omni', ['pork'], 1],
  ['Trứng hấp nấm + đậu hũ + cơm', 460, 24, 60, 14, 'm', 'home', 'veg', ['egg'], 1],
  ['Cơm + đậu hũ kho nấm + edamame', 520, 30, 60, 17, 'm', 'home', 'vegan', [], 1],
  ['Tempeh áp chảo + khoai lang + rau', 480, 28, 50, 18, 'm', 'home', 'vegan', [], 2],
  ['Salad đậu gà + trứng + rau', 430, 24, 40, 18, 'm', 'home', 'veg', ['egg'], 1],
  ['Mì xào chay đậu hũ + rau (ít dầu)', 500, 22, 65, 16, 'm', 'home', 'vegan', ['gluten'], 1],
  ['Gà luộc xé phay + cơm gạo lứt', 500, 40, 52, 12, 'm', 'home', 'omni', [], 1],
  ['Thịt bò nạc áp chảo + khoai tây + salad', 540, 38, 45, 20, 'm', 'home', 'omni', ['beef'], 2]
].map(_dish);

// Món phụ / món thêm để bổ sung cho đủ khẩu phần. role: protein | fruit | carb | veg | fat
const _snack = ([n, kcal, p, c, f, role, diet, tags, cost]) => ({n, kcal, p, c, f, role, diet, tags, cost, src: 'any', tip: ''});
BRAIN.SNACKS = [
  ['Sữa chua không đường', 60, 4, 6, 2, 'protein', 'veg', ['dairy'], 1],
  ['Sữa chua Hy Lạp không đường', 100, 10, 4, 4, 'protein', 'veg', ['dairy'], 2],
  ['1 quả trứng luộc', 75, 6, 0.6, 5, 'protein', 'veg', ['egg'], 1],
  ['2 quả trứng luộc', 150, 12, 1, 10, 'protein', 'veg', ['egg'], 1],
  ['Sữa tươi không đường (220ml)', 140, 7, 10, 8, 'protein', 'veg', ['dairy'], 1],
  ['Sữa đậu nành không đường', 110, 7, 8, 5, 'protein', 'vegan', [], 1],
  ['Đậu hũ non', 90, 8, 3, 5, 'protein', 'vegan', [], 1],
  ['Đậu nành Nhật luộc (edamame 100g)', 120, 11, 9, 5, 'protein', 'vegan', [], 1],
  ['Tempeh áp chảo (80g)', 155, 15, 7, 8, 'protein', 'vegan', [], 2],
  ['Thêm 100g ức gà luộc', 165, 31, 0, 3.6, 'protein', 'omni', [], 1],
  ['Thêm 80g thịt bò nạc', 145, 21, 0, 6, 'protein', 'omni', ['beef'], 2],
  ['Whey protein (1 muỗng)', 120, 24, 3, 1.5, 'protein', 'veg', ['dairy'], 3],
  ['Đạm thực vật pea protein (1 muỗng)', 110, 20, 2, 2, 'protein', 'vegan', [], 3],
  ['Chuối', 105, 1.3, 27, 0.4, 'fruit', 'vegan', [], 1],
  ['Táo', 95, 0.5, 25, 0.3, 'fruit', 'vegan', [], 1],
  ['Ổi', 70, 2.6, 15, 1, 'fruit', 'vegan', [], 1],
  ['Khoai lang luộc (150g)', 130, 2.4, 30, 0.2, 'carb', 'vegan', [], 1],
  ['Bắp luộc', 180, 5, 40, 2, 'carb', 'vegan', [], 1],
  ['½ chén cơm thêm', 100, 2, 22, 0.2, 'carb', 'vegan', [], 1],
  ['Rau luộc thêm (1 đĩa)', 50, 3, 8, 0.5, 'veg', 'vegan', [], 1],
  ['Hạt điều / hạnh nhân (20g)', 115, 4, 6, 9, 'fat', 'vegan', ['nuts'], 2]
].map(_snack);

// Cách chia calo cho các bữa: [tên bữa, tỉ lệ, loại bữa (b/m/s), nhóm trong nhật ký]
BRAIN.MEAL_SPLITS = {
  2: [['Bữa 1', 0.45, 'm', 'trua'], ['Bữa 2', 0.55, 'm', 'toi']],
  3: [['Sáng', 0.25, 'b', 'sang'], ['Trưa', 0.40, 'm', 'trua'], ['Tối', 0.35, 'm', 'toi']],
  5: [['Sáng', 0.22, 'b', 'sang'], ['Phụ sáng', 0.08, 's', 'phu'], ['Trưa', 0.32, 'm', 'trua'], ['Phụ chiều', 0.10, 's', 'phu'], ['Tối', 0.28, 'm', 'toi']]
};
BRAIN.MEAL_TIMES = {2: '2 bữa trong khung 8 tiếng, ví dụ 11:30 và 19:00', 3: '3 bữa: khoảng 7:00, 12:00 và 18:30', 5: '3 bữa chính (7:00, 12:00, 18:30) và 2 bữa phụ nhỏ (10:00, 15:30)'};
// Ăn quanh giờ tập: trước tập (tinh bột dễ tiêu), sau tập (đạm)
BRAIN.WORKOUT_FUEL = {
  am: {pre: '30 phút trước khi tập', post: 'Ăn sáng ngay sau tập'},
  noon: {pre: 'Bữa phụ lúc 10:00', post: 'Bữa trưa ngay sau tập'},
  pm: {pre: '60–90 phút trước khi tập (khoảng 16:00)', post: 'Bữa tối sau tập'},
  any: {pre: '60–90 phút trước khi tập', post: 'Trong vòng 1–2 giờ sau tập'}
};

// Nguồn đạm gợi ý: [tên, lượng đạm, nhóm (dùng để lọc theo chế độ ăn / dị ứng), mức giá]
BRAIN.PROTEINS = [
  ['Trứng gà', '1 quả ≈ 6g đạm', 'egg', 1], ['Ức gà', '100g ≈ 31g', 'meat', 1], ['Thịt heo nạc / thăn', '100g ≈ 21g', 'pork', 1],
  ['Cá basa / cá rô phi', '100g ≈ 18g', 'seafood', 1], ['Đậu hũ', '100g ≈ 8g', 'plant', 1], ['Sữa đậu nành không đường', '1 hộp ≈ 7g', 'plant', 1],
  ['Đậu nành Nhật (edamame)', '100g ≈ 11g', 'plant', 1], ['Sữa chua không đường', '1 hũ ≈ 4g', 'dairy', 1],
  ['Đậu lăng, đậu đen, đậu gà', '1 chén chín ≈ 15g', 'plant', 1], ['Sữa chua Hy Lạp', '100g ≈ 10g', 'dairy', 2],
  ['Thịt bò nạc', '100g ≈ 26g', 'beef', 2], ['Tôm', '100g ≈ 24g', 'seafood', 2], ['Tempeh (đậu nành lên men)', '100g ≈ 19g', 'plant', 2],
  ['Cá hồi / cá thu', '100g ≈ 20g', 'seafood', 3], ['Whey protein', '1 muỗng ≈ 24g', 'dairy', 3], ['Đạm thực vật (pea protein)', '1 muỗng ≈ 20g', 'plant', 3]
];
BRAIN.CARBS = ['Cơm (gạo lứt càng tốt)', 'Khoai lang, khoai tây', 'Yến mạch', 'Bún, phở', 'Bắp', 'Bánh mì (nguyên cám càng tốt)'];
