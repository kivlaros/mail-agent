export function autoRUS(data) {
  const result = data
    .filter((item) => item.AV === "20%") // Фильтруем объекты с AZ = '20%'
    .map((item) => {
      const B = deletSumbolsFromString(item.B.toString());
      const AA = Number(item.AA); // Преобразуем в число
      const BC = Number(item.BC); // Преобразуем в число
      const ratio = BC / AA; // Вычисляем соотношение

      return [B, AA, BC, BC, ratio]; // Формируем массив
    });
  return result;
}

function deletSumbolsFromString(str){
    return  str.replace(/[^a-zа-яё^0-9]/gi,'').toUpperCase()
}