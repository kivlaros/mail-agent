export function stparts(data) {
  const result = data
    .filter((item) => item.AZ === "20%") // Фильтруем объекты с AZ = '20%'
    .map((item) => {
      const B = deletSumbolsFromString(item.B.toString());
      const AA = Number(item.AA); // Преобразуем в число
      const BF = Number(item.BF); // Преобразуем в число
      const ratio = BF / AA; // Вычисляем соотношение

      return [B, AA, BF, BF, ratio]; // Формируем массив
    });
  return result;
}

function deletSumbolsFromString(str){
    return  str.replace(/[^a-zа-яё^0-9]/gi,'').toUpperCase()
}