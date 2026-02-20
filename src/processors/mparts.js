export function Mparts(data) {
  const result = data
    .filter((item) => item.BD === "22%") // Фильтруем объекты с AZ = '20%'
    .map((item) => {
      const B = deletSumbolsFromString(item.B.toString());
      const AD = Number(item.AD); // Преобразуем в число
      const BK = Number(item.BK); // Преобразуем в число
      const ratio = BK / AD; // Вычисляем соотношение

      return [B, AD, BK, BK, ratio]; // Формируем массив
    });
  return result;
}

function deletSumbolsFromString(str){
    return  str.replace(/[^a-zа-яё^0-9]/gi,'').toUpperCase()
}