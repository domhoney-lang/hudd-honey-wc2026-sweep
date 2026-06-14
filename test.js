const decimalToFraction = (decimal) => {
    let d = Number(decimal) - 1;
    if (d <= 0) return 'Evens';
    if (Math.abs(d - 0.333) < 0.01) return '1/3';
    if (Math.abs(d - 0.667) < 0.01) return '2/3';
    
    let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
    let b = d;
    do {
        let a = Math.floor(b);
        let aux = h1; h1 = a * h1 + h2; h2 = aux;
        aux = k1; k1 = a * k1 + k2; k2 = aux;
        b = 1 / (b - a);
    } while (Math.abs(d - h1 / k1) > d * 1.0E-5);
    return `${h1}/${k1}`;
};
console.log(5.5, decimalToFraction(5.5));
console.log(1.33, decimalToFraction(1.33));
console.log(21.0, decimalToFraction(21.0));
console.log(4.5, decimalToFraction(4.5));
console.log(2.75, decimalToFraction(2.75));
