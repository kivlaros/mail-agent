export function as(data) {
  const result = data
    .filter((item) => item.AL === "20%") // Фильтруем объекты с AZ = '20%'
    .map((item) => {
      const D = deletSumbolsFromString(item.D.toString());
      const X = Number(item.X); // Преобразуем в число
      const AR = Number(item.AR); // Преобразуем в число
      const ratio = AR / X; // Вычисляем соотношение

      return [D, X, AR, AR, ratio]; // Формируем массив
    });
  return result;
}

function deletSumbolsFromString(str){
    return  str.replace(/[^a-zа-яё^0-9]/gi,'').toUpperCase()
}