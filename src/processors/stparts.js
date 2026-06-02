export function stparts(data) {
  console.log(data)
  const result = data
    .filter((item) => item.BB === "22%") // Фильтруем объекты с AZ = '20%'
    .map((item) => {
      const B = deletSumbolsFromString(item.B.toString());
      const AC = Number(item.AC); // Преобразуем в число
      const BH = Number(item.BH); // Преобразуем в число
      const ratio = BH / AC; // Вычисляем соотношение

      return [B, AC, BH, BH, ratio]; // Формируем массив
    });
  return result;
}

function deletSumbolsFromString(str){
    return  str.replace(/[^a-zа-яё^0-9]/gi,'').toUpperCase()
}