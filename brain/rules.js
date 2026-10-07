/* =====================================================================
   BỘ NÃO · BỘ QUY TẮC CỦA HUẤN LUYỆN VIÊN
   R(nhóm, ưu tiên, khi nào áp dụng, nội dung)
     nhóm  – safety (an toàn) | insight (phân tích) | coach (nhận xét theo nhật ký)
             train (tập luyện) | eat (ăn uống) | habit (thói quen)
             out (ăn ngoài / nấu ăn) | fav (món khoái khẩu) | check (theo dõi)
     ưu tiên – số nhỏ hiện trước
     khi nào – (p = hồ sơ, c = số liệu đã tính) => true/false
               c.log chỉ có khi đã có nhật ký (xem ENGINE.review)
     nội dung – chuỗi, hoặc hàm trả về chuỗi / mảng chuỗi
   ===================================================================== */
window.BRAIN = window.BRAIN || {};

BRAIN.HABIT_NAMES = {milktea: 'Trà sữa', soda: 'Nước ngọt', sweets: 'Đồ ngọt', latenight: 'Ăn khuya', eatout: 'Ăn ngoài nhiều', beer: 'Bia rượu', skipbf: 'Bỏ bữa sáng', fast: 'Ăn nhanh', fewveg: 'Ít rau', snacking: 'Ăn vặt'};

BRAIN.RULES = (() => {
  const f0 = n => Math.round(n).toLocaleString('vi-VN');
  const f1 = n => (Math.round(n * 10) / 10).toLocaleString('vi-VN');
  const dv = s => { if (!s) return '—'; const [y, m, d] = s.split('-'); return `${d}/${m}/${y}`; };
  const has = (arr, k) => (arr || []).includes(k);
  const bmiCls = b => b < 18.5 ? 'thiếu cân' : b < 23 ? 'bình thường' : b < 25 ? 'thừa cân' : 'béo phì';
  const R = (cat, pri, when, text) => ({cat, pri, when, text});
  const BAD = ['milktea', 'soda', 'beer', 'latenight', 'sweets', 'eatout'];

  return [
    /* ================= AN TOÀN ================= */
    R('safety', 1, p => has(p.health, 'heart'),
      'Bạn có bệnh tim mạch: <b>cần bác sĩ đồng ý trước khi bắt đầu tập</b>. Kế hoạch chỉ dùng cường độ nhẹ đến vừa, không có bài biến tốc hay bật nhảy.'),
    R('safety', 1, p => p.special === 'pregnant',
      'Đang mang thai: app <b>không đặt mục tiêu giảm cân</b> và đã loại bài nằm ngửa, bật nhảy, tạ nặng, bài giữ thăng bằng khó. Dừng tập ngay nếu chóng mặt, khó thở, đau bụng hoặc ra máu. Hãy hỏi bác sĩ sản khoa về mức vận động phù hợp.'),
    R('safety', 1, p => p.special === 'breastfeeding',
      'Đang cho con bú: giảm cân chậm (tối đa khoảng 0,5 kg/tuần), ăn không dưới 1.800 kcal/ngày và uống nhiều nước để đủ sữa.'),
    R('safety', 1, p => p.age < 18,
      'Dưới 18 tuổi: cơ thể vẫn đang phát triển. App giới hạn mức thâm hụt calo và khuyên có phụ huynh hoặc bác sĩ theo dõi.'),
    R('safety', 2, (p, c) => has(c.flags, 'floor') && !has(c.flags, 'noDeficit'),
      (p, c) => `Để đạt tốc độ đã chọn, bạn phải ăn dưới ${f0(c.floor)} kcal/ngày, quá thấp để an toàn. App giữ ở mức <b>${f0(c.target)} kcal</b>, nên tiến độ chậm hơn (khoảng ${f1(c.rate)} kg/tuần). Tập thêm sẽ giúp nhanh hơn.`),
    R('safety', 2, (p, c) => has(c.flags, 'noDeficit'),
      (p, c) => `Mức tiêu hao của bạn khá thấp (khoảng ${f0(c.tdee)} kcal/ngày), sát với mức ăn tối thiểu an toàn ${f0(c.floor)} kcal. Vì vậy <b>không thể giảm cân chỉ bằng ăn ít hơn</b>. Cách hiệu quả là tăng vận động: đi bộ thêm 20–30 phút mỗi ngày hoặc thêm 1 buổi tập.`),
    R('safety', 2, (p, c) => c.goalBmi >= 18.5 && c.goalBmi < 19.5,
      (p, c) => `Cân nặng mục tiêu sát ngưỡng thiếu cân (BMI ${f1(c.goalBmi)}). Nên cân nhắc dừng ở khoảng ${f0(c.range.lo + 2)} kg và tập trung vào săn chắc.`),
    R('safety', 3, p => p.age >= 60,
      'Trên 60 tuổi: khởi động kỹ hơn (10 phút), đã thêm bài thăng bằng để phòng té ngã và loại các bài bật nhảy. Luôn tập gần tường hoặc ghế để vịn khi cần.'),
    R('safety', 3, p => has(p.health, 'bp') || has(p.health, 'sugar'),
      'Bạn có bệnh nền. Nếu đang dùng thuốc, hãy hỏi bác sĩ trước khi thay đổi lớn về ăn uống và tập luyện, vì nhu cầu thuốc có thể thay đổi khi giảm cân.'),

    /* ================= PHÂN TÍCH ================= */
    R('insight', 1, () => true,
      (p, c) => `Cân nặng hiện tại <b>${f1(c.w)} kg</b>, BMI <b>${f1(c.bmi)}</b> (${bmiCls(c.bmi)} theo chuẩn châu Á). Với chiều cao ${p.height} cm, khoảng cân nặng khỏe mạnh là <b>${f1(c.range.lo)}–${f1(c.range.hi)} kg</b>.`),
    R('insight', 2, (p, c) => c.dir !== 0 && c.eta,
      (p, c) => `Mục tiêu ${f1(p.goalWeight)} kg: cần ${c.dir < 0 ? 'giảm' : 'tăng'} <b>${f1(Math.abs(c.diff))} kg</b>. Với tốc độ khoảng ${f1(c.rate)} kg/tuần, dự kiến đạt vào <b>${dv(c.eta)}</b> (~${f0(c.weeks)} tuần).`),
    R('insight', 2, (p, c) => c.dir === 0 && p.special !== 'pregnant',
      'Bạn đang ở mức cân mục tiêu. Kế hoạch tập trung giữ cân, tăng sức mạnh, sức bền và cải thiện vóc dáng.'),
    R('insight', 3, () => true,
      (p, c) => `Mỗi ngày cơ thể tiêu hao khoảng <b>${f0(c.tdee)} kcal</b> (đã tính các buổi tập trong lịch). Mục tiêu ăn trung bình <b>${f0(c.target)} kcal</b>, gồm <b>${c.protein}g đạm</b>, ${c.carb}g tinh bột và ${c.fat}g chất béo.`),
    R('insight', 3, (p, c) => c.cycleDelta >= 60,
      (p, c) => `Ngày tập ăn nhiều hơn ngày nghỉ khoảng ${f0(c.cycleDelta)} kcal (đã tính sẵn ở tab Hôm nay), để có sức tập và phục hồi. Trung bình cả tuần vẫn đúng mục tiêu.`),
    R('insight', 3, (p, c) => has(c.flags, 'capped'),
      'Mức thâm hụt đã được giới hạn ở 25% tổng tiêu hao. Thâm hụt lớn hơn dễ gây mất cơ, mệt mỏi và ăn bù.'),
    R('insight', 4, (p, c) => c.weeklyMin >= 150,
      (p, c) => `Lịch tập ${f0(c.weeklyMin)} phút/tuần đã đạt mức WHO khuyến nghị (tối thiểu 150 phút) 👍`),
    R('insight', 4, (p, c) => c.weeklyMin < 150,
      (p, c) => `Lịch tập ${f0(c.weeklyMin)} phút/tuần, thấp hơn mức WHO khuyến nghị (150 phút). Hãy bù bằng đi bộ ${f0((150 - c.weeklyMin) / 7)} phút mỗi ngày.`),
    R('insight', 5, (p, c) => p.focus === 'muscle' && c.dir < 0,
      'Bạn muốn tăng cơ nhưng cân mục tiêu thấp hơn hiện tại. Hướng phù hợp là <b>"recomp"</b>: ăn thâm hụt nhẹ, nhiều đạm, ưu tiên tập tạ. Cân giảm chậm nhưng vóc dáng gọn và săn hơn.'),
    R('insight', 5, (p, c) => p.focus === 'fat' && c.dir > 0,
      'Bạn chọn "giảm mỡ" nhưng cân mục tiêu cao hơn hiện tại. Kế hoạch sẽ đi theo hướng tăng cân chậm và nhiều đạm để hạn chế tích mỡ.'),
    R('insight', 6, p => (p.habits || []).some(h => BAD.includes(h)),
      p => `Thói quen ảnh hưởng nhiều nhất: <b>${p.habits.filter(h => BAD.includes(h)).map(h => BRAIN.HABIT_NAMES[h]).join(', ')}</b>. Sửa 1–2 thói quen này thường hiệu quả hơn ăn kiêng khắt khe.`),
    R('insight', 7, p => p.waist && ((p.sex === 'm' && p.waist >= 90) || (p.sex === 'f' && p.waist >= 80)),
      p => `Vòng eo ${p.waist} cm cao hơn ngưỡng khuyến nghị cho người châu Á (nam dưới 90 cm, nữ dưới 80 cm), cho thấy mỡ nội tạng cao. Giảm vòng eo sẽ cải thiện sức khỏe rõ rệt, kể cả khi cân giảm chậm.`),
    R('insight', 7, p => p.waist && ((p.sex === 'm' && p.waist < 90) || (p.sex === 'f' && p.waist < 80)),
      p => `Vòng eo ${p.waist} cm nằm trong ngưỡng an toàn 👍. Đo lại mỗi 2 tuần, vì đây là chỉ số phản ánh mỡ bụng tốt hơn cân nặng.`),
    R('insight', 8, p => p.job === 'desk',
      'Bạn ngồi nhiều. Vận động ngoài giờ tập (đi lại, đứng, làm việc nhà) chiếm phần lớn calo đốt mỗi ngày, nên cứ mỗi giờ hãy đứng dậy đi lại 3–5 phút.'),
    R('insight', 9, (p, c) => c.weeks > 40,
      'Mục tiêu dài hơn 9 tháng: hãy chia thành các chặng, mỗi chặng giảm 5–10% cân nặng trong 3–4 tháng, xen giữa là 2–4 tuần ăn giữ cân để cơ thể và tinh thần được nghỉ.'),

    /* ================= HLV NHẬN XÉT THEO NHẬT KÝ ================= */
    R('coach', 1, (p, c) => c.log && c.log.daysSinceStart >= 3 && c.log.loggedDays === 0,
      'Tuần qua bạn chưa ghi bữa ăn nào. Không cần ghi hoàn hảo: chỉ cần ghi 4–5 ngày mỗi tuần là đủ để HLV điều chỉnh kế hoạch cho bạn.'),
    R('coach', 1, (p, c) => c.log && c.log.plannedSoFar > 0 && c.log.done < c.log.plannedSoFar,
      (p, c) => `Tuần này bạn đã tập <b>${c.log.done}/${c.log.plannedSoFar}</b> buổi tính đến hôm nay. Lỡ buổi thì không cần tập bù gấp đôi, cứ tiếp tục buổi kế tiếp theo lịch. Bận quá thì tập bản rút gọn 20 phút (chỉ 3 bài đầu).`),
    R('coach', 2, (p, c) => c.log && c.log.plannedWeek > 0 && c.log.done >= c.log.plannedWeek,
      (p, c) => `Đã hoàn thành đủ <b>${c.log.done}/${c.log.plannedWeek}</b> buổi tập tuần này 💪 Tuyệt vời, giữ nhịp này nhé!`),
    R('coach', 2, (p, c) => c.log && c.log.plannedSoFar > 0 && c.log.done >= c.log.plannedSoFar && c.log.done < c.log.plannedWeek,
      (p, c) => `Đúng lịch: đã tập ${c.log.done}/${c.log.plannedWeek} buổi tuần này. Còn ${c.log.plannedWeek - c.log.done} buổi nữa!`),
    R('coach', 2, (p, c) => c.log && c.log.loggedDays >= 3 && c.log.kcalDiff > 150,
      (p, c) => `7 ngày qua bạn ăn trung bình ${f0(c.log.avgKcal)} kcal, <b>vượt mục tiêu khoảng ${f0(c.log.kcalDiff)} kcal/ngày</b>. Thử bỏ 1 món dễ bỏ nhất (đồ uống ngọt, đồ chiên, ăn vặt) thay vì cắt bữa chính.`),
    R('coach', 2, (p, c) => c.log && c.log.loggedDays >= 3 && c.log.kcalDiff < -350 && c.dir <= 0,
      (p, c) => `Bạn đang ăn <b>ít hơn mục tiêu khoảng ${f0(-c.log.kcalDiff)} kcal/ngày</b>. Ăn quá ít dễ mất cơ và dẫn tới ăn bù; hãy ăn đủ khẩu phần, tiến độ vẫn tốt. (Hoặc có thể bạn quên ghi vài món.)`),
    R('coach', 2, (p, c) => c.log && c.log.loggedDays >= 3 && c.log.kcalDiff < -150 && c.dir > 0,
      (p, c) => `Bạn đang ăn thiếu khoảng ${f0(-c.log.kcalDiff)} kcal/ngày so với mục tiêu tăng cân. Thêm 1 ly sữa hoặc sinh tố mỗi ngày là cách dễ nhất.`),
    R('coach', 3, (p, c) => c.log && c.log.loggedDays >= 3 && c.log.protPct < 0.8,
      (p, c) => `Đạm trung bình ${f0(c.log.avgP)}g/ngày, mới đạt <b>${f0(c.log.protPct * 100)}%</b> mục tiêu. Cách dễ nhất: thêm 1 phần đạm vào bữa sáng (trứng, sữa chua Hy Lạp, đậu hũ, sữa đậu nành).`),
    R('coach', 3, (p, c) => c.log && c.log.loggedDays >= 3 && c.log.protPct >= 0.9,
      (p, c) => `Đạm đạt ${f0(c.log.protPct * 100)}% mục tiêu 👍 Đây là yếu tố quan trọng nhất để giữ cơ khi giảm cân.`),
    R('coach', 3, (p, c) => c.log && c.log.weekendExtra > 300,
      (p, c) => `Cuối tuần bạn ăn nhiều hơn ngày thường khoảng <b>${f0(c.log.weekendExtra)} kcal/ngày</b>. Có thể chừa ra 100–150 kcal mỗi ngày trong tuần, hoặc lên trước thực đơn cho cuối tuần.`),
    R('coach', 2, (p, c) => c.log && c.log.trend !== null && c.dir < 0 && c.log.trend > -0.1,
      'Cân gần như đứng yên trong 2 tuần qua. Nếu bạn đã ghi chép đủ, hãy giảm 100–150 kcal/ngày hoặc đi thêm 2.000 bước. Xem thẻ "Hiệu chỉnh theo dữ liệu thực tế" ở tab Kế hoạch.'),
    R('coach', 2, (p, c) => c.log && c.log.trend !== null && c.dir < 0 && c.log.trend < -c.w * 0.01,
      (p, c) => `Bạn đang giảm ${f1(-c.log.trend)} kg/tuần, <b>nhanh hơn mức an toàn</b> (khoảng 1% cân nặng). Hãy ăn thêm 150–200 kcal/ngày để giữ cơ.`),
    R('coach', 3, (p, c) => c.log && c.log.trend !== null && c.dir < 0 && c.log.trend <= -0.2 && c.log.trend >= -c.w * 0.01,
      (p, c) => `Tiến độ đẹp: ${f1(c.log.trend)} kg/tuần, đúng hướng và đúng tốc độ 👏`),
    R('coach', 2, (p, c) => c.log && c.log.trend !== null && c.dir > 0 && c.log.trend < 0.05,
      'Cân chưa tăng trong 2 tuần qua. Hãy ăn thêm 150–200 kcal/ngày (1 ly sữa, 1 nắm hạt hoặc thêm ½ chén cơm mỗi bữa).'),
    R('coach', 2, (p, c) => c.log && c.log.trend !== null && c.dir > 0 && c.log.trend > c.w * 0.006,
      (p, c) => `Bạn tăng ${f1(c.log.trend)} kg/tuần, nhanh hơn mức tối ưu nên dễ tích mỡ. Giảm 100–150 kcal/ngày.`),
    R('coach', 3, (p, c) => c.log && c.log.lastWeighAgo >= 7,
      (p, c) => `Đã ${c.log.lastWeighAgo} ngày bạn chưa cân. Cân 3–4 buổi sáng mỗi tuần để HLV theo dõi xu hướng chính xác.`),
    R('coach', 4, (p, c) => c.log && c.log.waterDays >= 3 && c.log.waterAvg < c.log.waterGoal * 0.6,
      (p, c) => `Bạn uống trung bình ${f1(c.log.waterAvg)}/${c.log.waterGoal} ly nước mỗi ngày. Để sẵn 1 chai nước trên bàn làm việc và uống 1 ly trước mỗi bữa.`),
    R('coach', 4, (p, c) => c.log && c.log.streak >= 3,
      (p, c) => `🔥 Chuỗi <b>${c.log.streak} ngày</b> ghi chép liên tục! Đều đặn quan trọng hơn hoàn hảo.`),

    /* ================= TẬP LUYỆN ================= */
    R('train', 0, (p, c) => c.phase.weekNote,
      (p, c) => `<b>Mục tiêu tuần ${c.phase.cycleWeek}:</b> ${c.phase.weekNote}`),
    R('train', 1, () => true,
      (p, c) => `Bạn đang ở <b>tuần ${c.phase.programWeek}</b>, giai đoạn <b>"${c.phase.name}"</b> (tuần ${c.phase.cycleWeek}/12 của chu kỳ ${c.phase.cycle}): ${c.phase.desc}`),
    R('train', 2, (p, c) => c.hasRepeat,
      '<b>Luân phiên:</b> buổi lặp lại trong tuần dùng biến thể bài khác để cơ thể được kích thích đa dạng.'),
    R('train', 2, (p, c) => c.backToBack,
      'Có 2 buổi toàn thân vào 2 ngày liền nhau: ở buổi thứ hai, giữ mức tạ nhẹ hơn và bớt 1 hiệp nếu cơ còn mỏi.'),
    R('train', 3, () => true,
      '<b>Tăng tiến kép:</b> khi làm đủ số lần tối đa ở tất cả các hiệp trong 2 buổi liên tiếp, hãy tăng tạ 2–5% (hoặc chuyển sang biến thể khó hơn), rồi tập lại từ mức số lần thấp nhất.'),
    R('train', 3, () => true,
      (p, c) => `<b>Độ nặng tuần này:</b> dừng mỗi hiệp khi còn khoảng <b>${c.phase.rir} lần</b> nữa mới kiệt sức (RIR ${c.phase.rir}). Đúng kỹ thuật quan trọng hơn tạ nặng.`),
    R('train', 4, p => p.exp === 'new',
      'Tuần đầu bạn sẽ bị đau mỏi cơ 1–3 ngày sau tập (DOMS). Đây là bình thường, vẫn nên đi bộ nhẹ để mau hồi phục.'),
    R('train', 4, () => true,
      (p, c) => `<b>Bước chân tuần này: ${f0(c.stepsNow)} bước/ngày.</b> ${c.stepsNow < c.stepsGoal ? `Cứ 2 tuần tăng thêm 1.000 bước cho tới ${f0(c.stepsGoal)}.` : 'Đã đạt mức mục tiêu, hãy duy trì.'} Đây là phần đốt calo hay bị bỏ quên nhất.`),
    R('train', 5, () => true, 'Thấy bài quá khó hay quá dễ? Ở tab Lịch tập, mỗi bài đều có gợi ý bài <b>dễ hơn</b> và <b>khó hơn</b> cùng nhóm cơ để thay.'),
    R('train', 5, () => true, 'Đau nhói ở khớp (khác với mỏi cơ) thì dừng bài đó ngay và thay bằng bài nhẹ hơn trong cùng nhóm.'),
    R('train', 6, p => +p.len <= 30, 'Buổi tập ngắn: làm theo vòng (circuit). Tập lần lượt từng bài, nghỉ 30–45 giây giữa các bài, lặp lại số vòng bằng số hiệp.'),
    R('train', 6, p => p.time === 'am', 'Tập sáng sớm: nếu thấy mệt, ăn nhẹ 1 quả chuối hoặc 1 hộp sữa trước 30 phút, rồi ăn sáng đầy đủ sau khi tập.'),
    R('train', 6, p => p.time === 'noon', 'Tập buổi trưa: ăn nhẹ lúc 10h, tập xong ăn bữa trưa có đủ đạm và tinh bột.'),
    R('train', 6, p => p.time === 'pm', 'Tập chiều tối: ăn bữa phụ có tinh bột 1–2 tiếng trước khi tập. Kết thúc tập nặng trước giờ ngủ ít nhất 2 tiếng.'),
    R('train', 6, (p, c) => true,
      (p, c) => `Với ${c.equipNames.length ? `dụng cụ bạn có (${c.equipNames.join(', ')})` : 'trọng lượng cơ thể và đồ gia dụng (ghế, bàn, bậc thang, khăn, balo)'}, app tìm được <b>${c.equipCount} bài tập</b> phù hợp và an toàn cho bạn.`),
    R('train', 7, p => !(p.equipment || []).some(q => ['db', 'band', 'barbell', 'cable', 'machine'].includes(q)),
      'Tập không tạ: tăng độ khó bằng cách xuống chậm 3 giây, dừng 1–2 giây ở điểm khó nhất, hoặc đổi sang biến thể khó hơn trong cùng nhóm.'),
    R('train', 7, (p, c) => c.equipUpgrades.length && c.equipUpgrades[0].gain >= 5,
      (p, c) => { const u = c.equipUpgrades.slice(0, 2); return `<b>Gợi ý dụng cụ:</b> ${u.map(x => `thêm <b>${x.name}</b> (${x.price}) sẽ mở thêm ${x.gain} bài`).join('; ')}. Cập nhật ở Cài đặt → Làm lại khảo sát khi mua thêm.`; }),
    R('train', 7, p => p.focus === 'muscle', 'Tăng cơ cần 3 thứ: tập nặng dần, đủ đạm và ngủ 7–9 tiếng. Thiếu một trong ba thì cơ tăng rất chậm.'),
    R('train', 7, p => has(p.areas, 'abs'), 'Vùng bụng: đã thêm bài core vào các buổi. Lưu ý <b>không thể giảm mỡ tại chỗ</b>: bài bụng giúp săn chắc, còn mỡ bụng giảm theo mỡ toàn thân nhờ ăn uống và vận động.'),
    R('train', 7, p => has(p.areas, 'glute'), 'Vùng mông, đùi: đã thêm bài mông bổ trợ. Hip thrust và squat là hai bài hiệu quả nhất; hãy tăng tạ dần đều ở hai bài này.'),
    R('train', 7, p => has(p.areas, 'arms'), 'Vùng tay: đã thêm bài tay trước và tay sau. Cơ tay nhỏ nên tăng tạ chậm (1–2 kg mỗi lần), ưu tiên làm chậm và đúng.'),
    R('train', 7, p => has(p.areas, 'chest'), 'Vùng ngực, vai: đã thêm bài đẩy bổ trợ. Luôn ép bả vai xuống và ra sau khi đẩy để bảo vệ khớp vai.'),
    R('train', 7, p => has(p.areas, 'posture'), 'Tư thế: đã thêm bài vai sau. Ngoài giờ tập, cứ mỗi 1–2 giờ làm 10 lần W-raise áp tường và giãn ngực ở khung cửa.'),
    R('train', 8, p => has(p.health, 'knee'), 'Đau gối: đã loại squat sâu, lunge, chạy và bật nhảy; thay bằng box squat, step-up, đạp xe, bơi. Giảm 1 kg cân nặng giúp gối nhẹ tải khoảng 4 kg mỗi bước đi.'),
    R('train', 8, p => has(p.health, 'back'), 'Đau lưng: đã thay deadlift và squat tạ đòn bằng bài nhẹ cho lưng. Luôn giữ lưng thẳng tự nhiên và siết bụng khi nâng tạ; bird-dog và dead bug giúp lưng khỏe hơn.'),
    R('train', 8, p => has(p.health, 'shoulder'), 'Đau vai: đã loại bài đẩy qua đầu và chống xà kép. Tăng cường bài kéo (chèo, kéo xà) để cân bằng vai.'),
    R('train', 8, p => has(p.health, 'bp'), 'Huyết áp cao: không nín thở khi gắng sức (thở ra khi đẩy hoặc kéo), tránh cường độ tối đa và bài giữ tư thế lâu. Tập đều đặn có thể giúp hạ huyết áp 5–8 mmHg.'),
    R('train', 8, p => has(p.health, 'sugar'), 'Đường huyết: đi bộ 10–15 phút sau mỗi bữa ăn giúp hạ đường huyết rõ rệt. Nếu dùng thuốc hạ đường huyết, hãy mang theo đồ ngọt nhẹ khi tập.'),
    R('train', 8, (p, c) => c.senior, 'Đã thêm 1 bài thăng bằng vào các buổi tập. Thăng bằng tốt giúp giảm nguy cơ té ngã khi lớn tuổi.'),

    /* ================= ĂN UỐNG ================= */
    R('eat', 1, () => true, (p, c) => `<b>Lịch ăn:</b> ${BRAIN.MEAL_TIMES[c.mealsN]}.`),
    R('eat', 1, (p, c) => c.mealsChanged,
      'Bạn chọn 2 bữa (nhịn ăn gián đoạn), nhưng với tình trạng sức khỏe hiện tại, app đã đổi sang 3 bữa cho an toàn.'),
    R('eat', 2, () => true,
      (p, c) => `<b>Mỗi bữa chính khoảng ${c.perMealP}g đạm.</b> Chia đều đạm cho các bữa giúp no lâu và giữ cơ tốt hơn dồn vào một bữa.`),
    R('eat', 2, () => true,
      (p, c) => `<b>Quy tắc đĩa ăn:</b> ½ đĩa là rau, ¼ là đạm (cỡ lòng bàn tay), ¼ là tinh bột (khoảng <b>${f1(c.chen)} chén cơm</b> mỗi bữa chính).`),
    R('eat', 3, () => true, (p, c) => `Uống khoảng <b>${f1(c.water)} lít nước/ngày</b> (thêm 0,5 lít vào ngày tập), 1 ly trước mỗi bữa ăn.`),
    R('eat', 3, () => true, (p, c) => `Ăn đủ <b>${c.fiber}g chất xơ/ngày</b>: rau ở mọi bữa, trái cây 1–2 lần/ngày, ưu tiên gạo lứt và các loại đậu.`),
    R('eat', 4, () => true, 'Ưu tiên luộc, hấp, kho, nướng. Đồ chiên rán tối đa 2–3 lần/tuần. Bớt nước chấm, nước béo và mỡ hành.'),
    R('eat', 4, p => true,
      p => { const w = BRAIN.WORKOUT_FUEL[p.time] || BRAIN.WORKOUT_FUEL.any; return `<b>Ăn quanh giờ tập:</b> trước tập ăn nhẹ tinh bột dễ tiêu (chuối, khoai lang) ${w.pre.toLowerCase()}; sau tập ăn bữa có 25–40g đạm (${w.post.toLowerCase()}).`; }),
    R('eat', 5, (p, c) => c.dir < 0, 'Chống đói: ăn rau và đạm trước, tinh bột sau; uống nước trước bữa; ưu tiên món nhiều nước (canh, phở, bún) vì no lâu mà ít calo.'),
    R('eat', 5, (p, c) => c.dir > 0, 'Khó ăn đủ? Thêm calo dạng lỏng (sữa, sinh tố), thêm dầu ô liu hoặc hạt vào món ăn, và thêm 1 bữa phụ trước khi ngủ.'),
    R('eat', 5, (p, c) => c.senior, 'Người lớn tuổi hấp thu đạm kém hơn: đã nâng mục tiêu đạm, mỗi bữa nên có ít nhất 25–30g đạm.'),
    R('eat', 6, p => p.diet === 'lowcarb', 'Ăn ít tinh bột: tỉ lệ chất béo đã tăng lên, lượng cơm giảm. Đừng cắt hẳn tinh bột vào ngày tập nặng.'),
    R('eat', 6, p => p.diet === 'vegan', 'Thuần chay: đạm đủ khó đạt nhất. Ưu tiên tempeh, đậu nành Nhật, đậu hũ, đậu lăng ở mọi bữa; cân nhắc bột đạm thực vật. Nên bổ sung vitamin B12 và kiểm tra sắt, canxi định kỳ.'),
    R('eat', 6, p => p.diet === 'veg', 'Ăn chay: trứng, sữa chua Hy Lạp, đậu hũ, đậu các loại là nguồn đạm chính. Nên kiểm tra sắt và B12 định kỳ.'),
    R('eat', 6, p => has(p.health, 'bp'), 'Huyết áp: ăn dưới 5g muối/ngày (khoảng 1 muỗng cà phê). Hạn chế nước mắm, mì gói, đồ muối chua, chả lụa.'),
    R('eat', 6, p => has(p.health, 'sugar'), 'Đường huyết: ăn rau và đạm trước, tinh bột sau. Chọn gạo lứt, khoai thay cơm trắng và bánh ngọt. Tránh nước trái cây và nước ngọt.'),
    R('eat', 6, p => p.special === 'pregnant', 'Mang thai: từ 3 tháng giữa, nhu cầu tăng thêm khoảng 300 kcal/ngày. Hãy theo dõi cân nặng cùng bác sĩ, không tự ăn kiêng.'),
    R('eat', 7, p => p.budget === 'low', 'Đạm rẻ mà tốt: trứng, đậu hũ, ức gà, cá basa, sữa đậu nành, đậu nành Nhật. Mua số lượng lớn, chia hộp rồi trữ đông.'),
    R('eat', 8, () => true, '<b>Quy tắc 80/20:</b> 80% thời gian ăn theo kế hoạch, 20% còn lại thoải mái. Không cần hoàn hảo, chỉ cần đều đặn.'),

    /* ================= THÓI QUEN ================= */
    R('habit', 1, p => has(p.habits, 'milktea'), 'Trà sữa (~350 kcal/ly): đổi sang size S, 30% đường, bỏ trân châu (bớt 150–200 kcal). Tối đa 1–2 ly/tuần và ghi vào app trước khi uống.'),
    R('habit', 1, p => has(p.habits, 'soda'), 'Nước ngọt (~140 kcal/lon): thay bằng nước lọc, trà không đường, nước có ga không đường hoặc bản zero.'),
    R('habit', 1, p => has(p.habits, 'beer'), 'Bia rượu (~145 kcal/lon): đặt giới hạn trước khi đi (tối đa 2 lon), xen kẽ nước lọc, chọn mồi luộc hoặc nướng. Bữa trước buổi nhậu ăn ít tinh bột.'),
    R('habit', 2, p => has(p.habits, 'latenight'), 'Ăn khuya: ăn tối xong trước giờ ngủ 2–3 tiếng, đánh răng sau bữa tối như một "tín hiệu kết thúc". Nếu đói: 1 hũ sữa chua hoặc 1 quả trứng.'),
    R('habit', 2, p => has(p.habits, 'sweets'), 'Đồ ngọt: đừng để sẵn trong tầm mắt. Thay bằng trái cây, sữa chua, hoặc chừa sẵn khoảng 150 kcal/ngày cho món ngọt.'),
    R('habit', 2, p => has(p.habits, 'skipbf'), 'Bỏ bữa sáng: không sao nếu không đói, miễn đủ đạm trong ngày. Tránh để bụng đói rồi ăn bù quá nhiều vào buổi tối.'),
    R('habit', 3, p => has(p.habits, 'fast'), 'Ăn nhanh: mỗi bữa ăn trong 15–20 phút, đặt đũa xuống giữa các miếng. Cơ thể cần khoảng 20 phút mới thấy no.'),
    R('habit', 3, p => has(p.habits, 'fewveg'), 'Ít rau: mỗi bữa chính ít nhất 1 nắm rau, ăn rau trước rồi mới ăn cơm. Mua rau đã sơ chế sẵn nếu bận.'),
    R('habit', 3, p => has(p.habits, 'snacking'), 'Ăn vặt khi rảnh hoặc xem phim: chia sẵn khẩu phần ra chén, không ăn trực tiếp từ bịch.'),
    R('habit', 4, p => p.sleep === 'short', 'Ngủ ít: thiếu ngủ làm tăng hormone đói và giảm khả năng giữ cơ. Đặt báo thức "đi ngủ", tắt màn hình 30 phút trước giờ ngủ, không uống cà phê sau 14h.'),
    R('habit', 4, p => p.stress === 'high', 'Stress cao: dễ thèm đồ ngọt và giữ nước. Mỗi ngày dành 10 phút đi bộ ngoài trời hoặc thở chậm (hít 4 giây, thở ra 6 giây).'),

    /* ================= ĂN NGOÀI / NẤU ĂN ================= */
    R('out', 1, p => p.cook !== 'self', '<b>Chọn món nước</b> (phở, bún, hủ tiếu) thay vì cơm chiên, mì xào. Xin thêm rau, ít bánh, chừa lại nước béo.'),
    R('out', 1, p => p.cook !== 'self', (p, c) => `<b>Cơm phần:</b> chọn 1 món đạm luộc, kho hoặc nướng, 1 món rau, ${f1(c.chen)} chén cơm. Không chan nước mỡ.`),
    R('out', 2, p => p.cook !== 'self', 'Mỗi món trong thực đơn gợi ý đều kèm <b>mẹo gọi món</b> (ví dụ: xin ít bánh, bỏ mỡ hành). Thói quen nhỏ này bớt được 100–200 kcal mỗi bữa.'),
    R('out', 3, p => p.cook === 'out', 'Chuẩn bị sẵn bữa phụ (trứng luộc, sữa chua, trái cây) để không phải mua đồ ăn vặt khi đói.'),
    R('out', 3, p => p.cook === 'some', 'Những hôm có thời gian, hãy tự nấu bữa tối. Đó là bữa dễ kiểm soát nhất trong ngày.'),
    R('out', 1, p => p.cook === 'self', 'Nấu sẵn đồ ăn vào Chủ nhật và Thứ 4: luộc hoặc ướp sẵn đạm, rửa sẵn rau, chia cơm vào hộp theo đúng số chén.'),
    R('out', 2, p => p.cook === 'self', 'Cân thực phẩm sống trong 1–2 tuần đầu để quen mắt với khẩu phần. Sau đó ước lượng bằng tay là đủ.'),
    R('out', 3, p => p.cook === 'self', 'Dùng chảo chống dính và bình xịt dầu: mỗi muỗng dầu ăn khoảng 120 kcal.'),

    /* ================= MÓN KHOÁI KHẨU ================= */
    R('fav', 1, p => (p.fav || '').trim(), p => p.fav.split(',').map(s => s.trim()).filter(Boolean).map(name => {
      const low = name.toLowerCase();
      const m = BRAIN.FOODS.find(x => x[0].toLowerCase().includes(low) || low.includes(x[0].toLowerCase()));
      return `<b>${name.replace(/[<>&"']/g, '')}</b>${m ? ` (~${m[2]} kcal / ${m[1]})` : ''}: vẫn ăn được, 1–2 lần/tuần. Ghi vào app <i>trước</i> khi ăn để biết còn bao nhiêu calo, và giảm tinh bột ở bữa đó.`;
    })),

    /* ================= THEO DÕI ================= */
    R('check', 1, () => true, 'Cân 3–4 lần/tuần vào buổi sáng, sau khi đi vệ sinh và trước khi ăn. Chỉ nhìn đường trung bình 7 ngày; cân dao động 0,5–1 kg mỗi ngày là bình thường.'),
    R('check', 2, (p, c) => c.dir < 0, 'Sau 2 tuần mà trung bình cân không giảm: giảm thêm 100–150 kcal/ngày hoặc đi thêm 2.000–3.000 bước. HLV cũng tự nhắc khi phát hiện cân đứng yên.'),
    R('check', 2, (p, c) => c.dir > 0, 'Sau 2 tuần mà cân không tăng: ăn thêm 150–200 kcal/ngày. Tăng quá 0,5 kg/tuần thì giảm bớt để hạn chế tích mỡ.'),
    R('check', 3, () => true, 'Đo vòng eo mỗi 2 tuần, chụp ảnh (trước, nghiêng, sau) mỗi 4 tuần. Nhiều khi cân đứng yên nhưng eo vẫn nhỏ lại.'),
    R('check', 4, () => true, 'Hết chu kỳ 12 tuần: làm lại khảo sát ở tab Cài đặt để app lập kế hoạch mới theo thể trạng mới.')
  ];
})();

// Câu động viên hằng ngày (hiện khi HLV chưa có nhận xét nào)
BRAIN.QUOTES = [
  'Một buổi tập ngắn vẫn hơn không tập.',
  'Hôm nay mệt? Làm phiên bản nhẹ của buổi tập, miễn là đừng bỏ.',
  'Cơ thể ghi nhớ những gì bạn làm đều đặn, không phải những gì bạn làm hoàn hảo.',
  'Đừng so với người khác, hãy so với chính bạn của tuần trước.',
  'Cân nặng dao động từng ngày, xu hướng mới là sự thật.',
  'Một bữa ăn chệch kế hoạch không phá hỏng cả tuần. Bỏ cuộc mới làm vậy.',
  'Uống nước, ngủ đủ, tập đều: ba việc nhỏ tạo nên thay đổi lớn.',
  'Mỗi hiệp tập hôm nay là một khoản tiết kiệm cho sức khỏe sau này.',
  'Khởi động kỹ, kỹ thuật đúng, rồi mới tới tạ nặng.',
  'Kỷ luật là làm điều đã hứa với bản thân, kể cả khi không có hứng.'
];
