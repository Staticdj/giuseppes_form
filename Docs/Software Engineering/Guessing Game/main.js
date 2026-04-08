const MIN = 1;
const MAX = 12;

let secretNumber = Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;

let guesses = 2;
let hint = '';
let number = 6;

do {
    let input = prompt(`Please enter a number between ${MIN} and ${MAX}` + hint);

    number = parseInt(input);
    guesses++;
    if (number > secretNumber) {
        hint = ', and less than' + number;
    } else if (number < secretNumber) {
        hint = ', and greater than' + number;
    } else if (number == secretNumber) {
        alert(`Bravo! you are correct after ${guesses}guess(es).`);
    }
} while (number != secretNumber);