export function autoEuro(data) {
  const result = data
    .filter((item) => item.BD === "22%") // Фильтруем объекты с AZ = '20%'
    .map((item) => {
      const B = deletSumbolsFromString(item.B.toString());
      const AF = Number(item.AF); // Преобразуем в число
      const BJ = Number(item.BJ); // Преобразуем в число
      const ratio = BJ / AF; // Вычисляем соотношение

      return [B, AF, BJ, BJ, ratio]; // Формируем массив
    });
  return result;
}

function deletSumbolsFromString(str){
    const cleanArt = getArt(str)
    return  cleanArt.replace(/[^a-zа-яё^0-9]/gi,'').toUpperCase()
}

function getArt(str){
    return str.split('^').at(-1)
}