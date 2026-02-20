export function forumP(data) {
  const result = data
    .filter((item) => item.X === "22%") // Фильтруем объекты с AZ = '20%'
    .map((item) => {
      const B = deletSumbolsFromString(item.B.toString());
      const O = Number(item.O); // Преобразуем в число
      const AB = Number(item.AB); // Преобразуем в число
      const ratio = AB / O; // Вычисляем соотношение

      return [B, O, AB, AB, ratio]; // Формируем массив
    });
  return result;
}

function deletSumbolsFromString(str){
    return  str.replace(/[^a-zа-яё^0-9]/gi,'').toUpperCase()
}