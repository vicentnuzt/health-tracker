/* =====================================================================
   BỘ NÃO · DINH DƯỠNG
   Bảng tra cứu món ăn Việt: calo, đạm, tinh bột, béo cho 1 phần thông thường.
   F(tên, khẩu phần, kcal, đạm, tinh bột, béo, nhóm, chế độ, dị ứng, [nhãn, lý do, gợi ý thay thế])
     nhóm   : xem FOOD_CATS
     chế độ : omni (có thịt/cá) | veg (chay, có trứng/sữa) | vegan (thuần chay)
     dị ứng : seafood dairy egg nuts gluten beef pork
     nhãn   : để trống thì bộ máy tự xếp ✅ nên ăn / ⚠️ hạn chế theo calo, đạm, đường, mỡ.
              Ghi 'good' hoặc 'limit' để ép nhãn, kèm lý do và gợi ý thay thế.
   ===================================================================== */
window.BRAIN = window.BRAIN || {};

BRAIN.FOOD_CATS = [
  {id: 'noodle', name: '🍜 Món nước'}, {id: 'rice', name: '🍚 Cơm'}, {id: 'bread', name: '🥖 Bánh mì, xôi, bánh'},
  {id: 'protein', name: '🍗 Thịt, cá, trứng, đậu'}, {id: 'healthy', name: '🥗 Món healthy'}, {id: 'veg', name: '🥬 Rau, canh, củ'},
  {id: 'fruit', name: '🍌 Trái cây'}, {id: 'drink', name: '🥤 Đồ uống, sữa'}, {id: 'snack', name: '🍰 Ăn vặt, đồ ngọt'}
];

BRAIN.FOOD_DB = (() => {
  const F = (n, unit, kcal, p, c, f, cat, diet, tags, flag, why, alt) => ({n, unit, kcal, p, c, f, cat, diet, tags: tags || [], flag: flag || null, why: why || '', alt: alt || ''});
  return [
    // ---------- Món nước ----------
    F('Phở bò', '1 tô', 450, 25, 60, 12, 'noodle', 'omni', ['beef'], null, '', 'Xin ít bánh, thêm rau, chừa nước béo'),
    F('Phở gà', '1 tô', 420, 25, 58, 9, 'noodle', 'omni', []),
    F('Phở chay', '1 tô', 380, 14, 62, 8, 'noodle', 'vegan', []),
    F('Bún bò Huế', '1 tô', 500, 25, 65, 15, 'noodle', 'omni', ['beef', 'pork'], null, '', 'Bỏ chả và giò heo, xin ít bún'),
    F('Bún chả', '1 phần', 550, 25, 65, 20, 'noodle', 'omni', ['pork'], null, '', 'Ăn nhiều rau, ít bún, ít nước chấm'),
    F('Bún thịt nướng', '1 tô', 520, 24, 65, 17, 'noodle', 'omni', ['pork', 'nuts'], null, '', 'Bỏ chả giò, ít mỡ hành'),
    F('Bún riêu cua', '1 tô', 420, 18, 55, 12, 'noodle', 'omni', ['seafood', 'pork']),
    F('Bún cá', '1 tô', 420, 24, 58, 9, 'noodle', 'omni', ['seafood']),
    F('Bún mọc', '1 tô', 430, 22, 58, 11, 'noodle', 'omni', ['pork']),
    F('Bún đậu mắm tôm', '1 mẹt', 650, 28, 70, 28, 'noodle', 'omni', ['pork', 'seafood'], null, '', 'Gọi đậu luộc thay đậu chiên, bớt chả cốm'),
    F('Hủ tiếu Nam Vang', '1 tô', 430, 22, 60, 10, 'noodle', 'omni', ['pork', 'seafood']),
    F('Hủ tiếu xào', '1 đĩa', 600, 18, 75, 25, 'noodle', 'omni', ['pork'], null, '', 'Chọn hủ tiếu nước'),
    F('Bánh canh cua', '1 tô', 480, 20, 65, 14, 'noodle', 'omni', ['seafood']),
    F('Mì Quảng', '1 tô', 480, 24, 62, 14, 'noodle', 'omni', ['nuts']),
    F('Miến gà', '1 tô', 400, 24, 55, 8, 'noodle', 'omni', []),
    F('Cháo gà', '1 tô', 320, 20, 42, 7, 'noodle', 'omni', []),
    F('Cháo lòng', '1 tô', 420, 18, 45, 18, 'noodle', 'omni', ['pork'], 'limit', 'Nhiều mỡ, nội tạng', 'Cháo gà, cháo cá'),
    F('Mì gói', '1 gói', 350, 7, 48, 14, 'noodle', 'veg', ['gluten'], 'limit', 'Nhiều muối, chiên sẵn, ít đạm', 'Bún, phở; nếu ăn thì thêm trứng và rau'),
    F('Mì xào bò', '1 đĩa', 650, 25, 70, 28, 'noodle', 'omni', ['beef', 'gluten'], null, '', 'Phở bò hoặc mì nước'),
    F('Lẩu', '1 phần', 600, 35, 40, 30, 'noodle', 'omni', [], null, '', 'Ăn nhiều rau, nấm, đạm; ít mì và nước lẩu béo'),

    // ---------- Cơm ----------
    F('Cơm tấm sườn', '1 đĩa', 650, 30, 80, 22, 'rice', 'omni', ['pork'], null, '', 'Bỏ mỡ hành, ít nước mắm, thêm dưa leo'),
    F('Cơm tấm sườn bì chả', '1 đĩa', 800, 35, 90, 32, 'rice', 'omni', ['pork', 'egg'], null, '', 'Chỉ gọi sườn, bỏ bì chả'),
    F('Cơm gà xối mỡ', '1 đĩa', 750, 32, 85, 30, 'rice', 'omni', [], null, '', 'Cơm gà luộc hoặc gà nướng'),
    F('Cơm gà luộc / gà xé', '1 đĩa', 580, 34, 75, 14, 'rice', 'omni', []),
    F('Cơm văn phòng (1 mặn 1 rau)', '1 phần', 600, 28, 80, 18, 'rice', 'omni', []),
    F('Cơm chiên dương châu', '1 đĩa', 700, 20, 90, 28, 'rice', 'omni', ['egg', 'pork'], null, '', 'Cơm trắng + món đạm luộc, kho'),
    F('Cơm bò lúc lắc', '1 đĩa', 680, 35, 75, 24, 'rice', 'omni', ['beef'], null, '', 'Đổi khoai tây chiên sang salad'),
    F('Cơm chay thập cẩm', '1 đĩa', 520, 16, 80, 14, 'rice', 'vegan', []),
    F('Cơm trắng', '1 chén (150g)', 200, 4, 45, 0.4, 'rice', 'vegan', []),
    F('Cơm gạo lứt', '1 chén (150g)', 180, 4, 38, 1.5, 'rice', 'vegan', [], 'good', 'Nhiều xơ, no lâu hơn cơm trắng'),

    // ---------- Bánh mì, xôi, bánh ----------
    F('Bánh mì thịt', '1 ổ', 400, 18, 50, 14, 'bread', 'omni', ['pork', 'gluten'], null, '', 'Ít pate, ít bơ, thêm rau'),
    F('Bánh mì trứng', '1 ổ', 380, 15, 45, 15, 'bread', 'veg', ['egg', 'gluten']),
    F('Bánh mì gà xé', '1 ổ', 400, 22, 48, 12, 'bread', 'omni', ['gluten']),
    F('Bánh mì chả cá', '1 ổ', 420, 18, 50, 15, 'bread', 'omni', ['seafood', 'gluten']),
    F('Xôi gà', '1 gói', 500, 20, 70, 15, 'bread', 'omni', [], null, '', 'Xin nửa phần xôi, giữ phần gà'),
    F('Xôi mặn thập cẩm', '1 gói', 600, 18, 80, 22, 'bread', 'omni', ['pork', 'egg'], null, '', 'Xôi gà, nửa phần xôi'),
    F('Xôi đậu xanh', '1 gói', 400, 10, 75, 6, 'bread', 'vegan', []),
    F('Bánh cuốn', '1 đĩa', 380, 14, 55, 11, 'bread', 'omni', ['pork']),
    F('Bánh bao nhân thịt', '1 cái', 300, 11, 40, 10, 'bread', 'omni', ['pork', 'gluten', 'egg']),
    F('Bánh xèo', '1 cái', 450, 14, 40, 26, 'bread', 'omni', ['seafood', 'pork'], null, '', 'Gỏi cuốn'),
    F('Bánh tráng nướng', '1 cái', 300, 8, 35, 14, 'bread', 'omni', ['egg']),
    F('Gỏi cuốn tôm thịt', '1 cuốn', 65, 3.5, 9, 1, 'bread', 'omni', ['seafood', 'pork'], 'good', 'Ít calo, nhiều rau'),
    F('Chả giò', '1 cuốn', 120, 4, 8, 8, 'bread', 'omni', ['pork'], 'limit', 'Chiên ngập dầu', 'Gỏi cuốn'),

    // ---------- Thịt, cá, trứng, đậu ----------
    F('Ức gà luộc / áp chảo', '100g', 165, 31, 0, 3.6, 'protein', 'omni', []),
    F('Đùi gà bỏ da', '100g', 180, 25, 0, 8, 'protein', 'omni', []),
    F('Thịt heo nạc', '100g', 143, 21, 0, 6, 'protein', 'omni', ['pork']),
    F('Thịt ba chỉ', '100g', 518, 9, 0, 53, 'protein', 'omni', ['pork'], null, '', 'Thịt nạc, nạc vai'),
    F('Sườn nướng', '1 miếng', 300, 22, 6, 20, 'protein', 'omni', ['pork'], null, '', 'Thịt nạc nướng'),
    F('Thịt bò nạc', '100g', 180, 26, 0, 8, 'protein', 'omni', ['beef']),
    F('Cá basa', '100g', 120, 18, 0, 5, 'protein', 'omni', ['seafood']),
    F('Cá hồi', '100g', 208, 20, 0, 13, 'protein', 'omni', ['seafood']),
    F('Cá thu', '100g', 200, 22, 0, 12, 'protein', 'omni', ['seafood']),
    F('Tôm', '100g', 100, 24, 0, 0.3, 'protein', 'omni', ['seafood']),
    F('Mực', '100g', 92, 16, 3, 1.4, 'protein', 'omni', ['seafood']),
    F('Trứng gà luộc', '1 quả', 75, 6, 0.6, 5, 'protein', 'veg', ['egg']),
    F('Trứng chiên', '1 quả', 110, 6, 0.6, 9, 'protein', 'veg', ['egg']),
    F('Trứng vịt lộn', '1 quả', 180, 13, 4, 12, 'protein', 'omni', ['egg']),
    F('Đậu hũ', '100g', 76, 8, 1.9, 4.8, 'protein', 'vegan', []),
    F('Đậu hũ chiên', '100g', 270, 17, 10, 20, 'protein', 'vegan', [], null, '', 'Đậu hũ non, đậu hũ hấp'),
    F('Tempeh', '100g', 190, 19, 9, 11, 'protein', 'vegan', []),
    F('Đậu nành Nhật (edamame)', '100g', 120, 11, 9, 5, 'protein', 'vegan', []),
    F('Đậu lăng / đậu gà (chín)', '1 chén', 230, 18, 40, 1, 'protein', 'vegan', []),
    F('Chả lụa', '100g', 220, 14, 2, 17, 'protein', 'omni', ['pork'], 'limit', 'Chế biến sẵn, nhiều muối', 'Thịt nạc luộc'),
    F('Xúc xích', '1 cây', 150, 6, 3, 13, 'protein', 'omni', ['pork'], 'limit', 'Chế biến sẵn, nhiều mỡ và muối', 'Trứng luộc, ức gà'),
    F('Whey protein', '1 muỗng', 120, 24, 3, 1.5, 'protein', 'veg', ['dairy']),
    F('Đạm thực vật (pea protein)', '1 muỗng', 110, 20, 2, 2, 'protein', 'vegan', []),

    // ---------- Món healthy tự nấu ----------
    F('Cơm + ức gà áp chảo + rau luộc', '1 phần', 520, 40, 60, 10, 'healthy', 'omni', []),
    F('Cơm gạo lứt + cá hấp + canh rau', '1 phần', 480, 30, 62, 10, 'healthy', 'omni', ['seafood']),
    F('Khoai lang + ức gà + salad', '1 phần', 420, 38, 40, 10, 'healthy', 'omni', []),
    F('Salad cá hồi + trứng', '1 phần', 450, 32, 12, 30, 'healthy', 'omni', ['seafood', 'egg']),
    F('Bún gạo lứt + gà xé + rau', '1 phần', 450, 32, 55, 9, 'healthy', 'omni', []),
    F('Ức gà xào nấm + bông cải', '1 phần', 380, 38, 20, 14, 'healthy', 'omni', []),
    F('Thịt bò áp chảo + khoai tây + salad', '1 phần', 540, 38, 45, 20, 'healthy', 'omni', ['beef']),
    F('Đậu hũ sốt cà + cơm + rau', '1 phần', 480, 18, 68, 14, 'healthy', 'vegan', []),
    F('Tempeh áp chảo + khoai lang + rau', '1 phần', 480, 28, 50, 18, 'healthy', 'vegan', []),
    F('Cơm + đậu hũ kho nấm + edamame', '1 phần', 520, 30, 60, 17, 'healthy', 'vegan', []),
    F('Trứng hấp nấm + đậu hũ', '1 phần', 250, 20, 6, 15, 'healthy', 'veg', ['egg']),
    F('Yến mạch + sữa chua Hy Lạp + trái cây', '1 tô', 330, 18, 50, 6, 'healthy', 'veg', ['dairy']),
    F('Sinh tố whey + chuối', '1 ly', 300, 26, 40, 3, 'healthy', 'veg', ['dairy']),

    // ---------- Rau, canh, củ ----------
    F('Rau luộc / xào ít dầu', '1 đĩa', 60, 3, 8, 2, 'veg', 'vegan', []),
    F('Rau muống xào tỏi', '1 đĩa', 150, 4, 8, 11, 'veg', 'vegan', []),
    F('Salad trộn dầu giấm', '1 đĩa', 120, 3, 10, 8, 'veg', 'vegan', []),
    F('Canh rau', '1 tô', 50, 2, 6, 2, 'veg', 'vegan', []),
    F('Canh chua cá', '1 tô', 150, 15, 10, 5, 'veg', 'omni', ['seafood']),
    F('Khoai lang luộc', '100g', 86, 1.6, 20, 0.1, 'veg', 'vegan', [], 'good', 'Tinh bột chậm, nhiều xơ'),
    F('Khoai tây luộc', '100g', 87, 2, 20, 0.1, 'veg', 'vegan', []),
    F('Khoai tây chiên', '1 phần vừa', 365, 4, 48, 17, 'veg', 'vegan', [], 'limit', 'Chiên ngập dầu', 'Khoai tây luộc, khoai lang'),
    F('Bắp luộc', '1 trái', 180, 5, 40, 2, 'veg', 'vegan', []),
    F('Yến mạch', '40g', 150, 5, 27, 2.5, 'veg', 'vegan', [], 'good', 'Tinh bột chậm, no lâu'),
    F('Bánh mì nguyên cám', '1 lát', 80, 4, 14, 1, 'veg', 'vegan', ['gluten'], 'good', 'Nhiều xơ hơn bánh mì trắng'),
    F('Bún tươi', '100g', 110, 2, 25, 0, 'veg', 'vegan', []),

    // ---------- Trái cây ----------
    F('Chuối', '1 quả', 105, 1.3, 27, 0.4, 'fruit', 'vegan', []),
    F('Táo', '1 quả', 95, 0.5, 25, 0.3, 'fruit', 'vegan', []),
    F('Ổi', '1 quả', 70, 2.6, 15, 1, 'fruit', 'vegan', []),
    F('Cam', '1 quả', 60, 1, 15, 0.2, 'fruit', 'vegan', []),
    F('Thanh long', '½ trái', 60, 1, 14, 0.2, 'fruit', 'vegan', []),
    F('Dưa hấu', '1 miếng (300g)', 90, 2, 22, 0.5, 'fruit', 'vegan', []),
    F('Xoài', '1 quả', 200, 2.8, 50, 1.3, 'fruit', 'vegan', []),
    F('Mít', '100g', 95, 1.7, 23, 0.6, 'fruit', 'vegan', []),
    F('Sầu riêng', '1 múi lớn (100g)', 150, 1.5, 27, 5, 'fruit', 'vegan', [], null, '', 'Ăn 1–2 múi nhỏ'),
    F('Bơ', '½ trái', 160, 2, 9, 15, 'fruit', 'vegan', [], null, 'Chất béo tốt nhưng nhiều calo'),

    // ---------- Đồ uống, sữa ----------
    F('Nước lọc / trà không đường', '1 ly', 0, 0, 0, 0, 'drink', 'vegan', []),
    F('Cà phê đen không đường', '1 ly', 5, 0.3, 0, 0, 'drink', 'vegan', [], 'good', 'Gần như 0 calo'),
    F('Cà phê sữa đá', '1 ly', 150, 2, 25, 4, 'drink', 'veg', ['dairy'], null, '', 'Cà phê đen, ít sữa'),
    F('Bạc xỉu', '1 ly', 200, 4, 30, 7, 'drink', 'veg', ['dairy'], 'limit', 'Nhiều sữa đặc, nhiều đường', 'Cà phê đen + chút sữa tươi'),
    F('Trà sữa trân châu', '1 ly size M', 350, 3, 60, 10, 'drink', 'veg', ['dairy'], 'limit', 'Nhiều đường, trân châu nhiều calo', 'Size S, 30% đường, bỏ trân châu'),
    F('Trà đào / trà chanh', '1 ly', 150, 0, 38, 0, 'drink', 'vegan', [], null, '', 'Trà không đường'),
    F('Nước ngọt có ga', '1 lon', 140, 0, 39, 0, 'drink', 'vegan', [], null, '', 'Nước có ga không đường, bản zero'),
    F('Nước ngọt zero', '1 lon', 1, 0, 0, 0, 'drink', 'vegan', []),
    F('Nước ép cam', '1 ly', 110, 2, 26, 0.5, 'drink', 'vegan', [], null, '', 'Ăn nguyên trái cam'),
    F('Sinh tố bơ', '1 ly', 350, 5, 45, 18, 'drink', 'veg', ['dairy'], 'limit', 'Nhiều đường và sữa đặc', 'Sinh tố không đường'),
    F('Nước dừa', '1 trái', 60, 1, 14, 0, 'drink', 'vegan', []),
    F('Bia', '1 lon 330ml', 145, 1.6, 13, 0, 'drink', 'vegan', ['gluten'], 'limit', 'Calo rỗng, dễ ăn nhiều đồ nhậu', 'Tối đa 2 lon, xen kẽ nước lọc'),
    F('Sữa tươi không đường', '220ml', 140, 7, 10, 8, 'drink', 'veg', ['dairy']),
    F('Sữa tươi có đường', '180ml', 140, 5, 20, 5, 'drink', 'veg', ['dairy'], null, '', 'Sữa không đường'),
    F('Sữa chua không đường', '1 hũ', 60, 4, 6, 2, 'drink', 'veg', ['dairy']),
    F('Sữa chua Hy Lạp', '1 hũ 100g', 100, 10, 4, 4, 'drink', 'veg', ['dairy']),
    F('Sữa đậu nành không đường', '1 hộp', 110, 7, 8, 5, 'drink', 'vegan', []),

    // ---------- Ăn vặt, đồ ngọt ----------
    F('Bánh tráng trộn', '1 bịch', 350, 6, 55, 12, 'snack', 'omni', ['egg'], 'limit', 'Nhiều tinh bột, dầu, ít đạm', 'Gỏi cuốn, trái cây'),
    F('Chè', '1 ly', 300, 5, 60, 5, 'snack', 'vegan', [], 'limit', 'Nhiều đường', 'Sữa chua + trái cây'),
    F('Bánh flan', '1 cái', 130, 4, 20, 4, 'snack', 'veg', ['egg', 'dairy']),
    F('Kem', '1 cây / viên', 200, 3, 24, 11, 'snack', 'veg', ['dairy'], 'limit', 'Nhiều đường và béo', 'Sữa chua đông lạnh, trái cây đông lạnh'),
    F('Bánh ngọt / bánh kem', '1 miếng', 350, 4, 45, 18, 'snack', 'veg', ['gluten', 'egg', 'dairy'], 'limit', 'Nhiều đường và bơ', 'Trái cây, sữa chua'),
    F('Snack khoai tây', '1 gói 30g', 160, 2, 15, 10, 'snack', 'vegan', [], 'limit', 'Chiên, nhiều muối, dễ ăn quá tay', 'Bắp luộc, hạt rang không muối'),
    F('Kẹo / socola sữa', '1 thanh', 230, 3, 26, 13, 'snack', 'veg', ['dairy', 'nuts'], 'limit', 'Nhiều đường', 'Socola đen 70%, 1–2 miếng'),
    F('Bắp rang bơ', '1 hộp vừa', 400, 5, 45, 22, 'snack', 'veg', ['dairy'], 'limit', 'Nhiều bơ và đường', 'Bắp luộc'),
    F('Hạt điều / hạnh nhân', '30g', 170, 5, 9, 14, 'snack', 'vegan', ['nuts'], null, 'Chất béo tốt nhưng nhiều calo, ăn 1 nắm nhỏ'),
    F('Đậu phộng rang', '30g', 170, 7, 5, 14, 'snack', 'vegan', ['nuts'])
  ];
})();

BRAIN.MEAL_TIMES = {2: '2 bữa trong khung 8 tiếng, ví dụ 11:30 và 19:00', 3: '3 bữa: khoảng 7:00, 12:00 và 18:30', 5: '3 bữa chính (7:00, 12:00, 18:30) và 2 bữa phụ nhỏ (10:00, 15:30)'};
// Ăn quanh giờ tập: trước tập (tinh bột dễ tiêu), sau tập (đạm)
BRAIN.WORKOUT_FUEL = {
  am: {pre: '30 phút trước khi tập', post: 'ăn sáng ngay sau tập'},
  noon: {pre: 'bữa phụ lúc 10:00', post: 'bữa trưa ngay sau tập'},
  pm: {pre: '60–90 phút trước khi tập (khoảng 16:00)', post: 'bữa tối sau tập'},
  any: {pre: '60–90 phút trước khi tập', post: 'trong vòng 1–2 giờ sau tập'}
};
