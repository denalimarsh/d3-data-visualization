// this file includes code for the letter count

// array of all lowercase letters
var letters = "abcdefghijklmnopqrstuvwxyz".split("");

/*
 * try this out in the console! you can access any variable or function
 * defined globally in the console
 *
 * and, you can right-click output in the console to make it global too!
 */

/*
 * removes any character (including spaces) that is not a letter
 * and converts all remaining letters to lowercase
 */
var onlyLetters = function(text) {
  // there are multiple ways to define a function in javascript!
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
  var notLetter = /[^a-z]/g;
  return text.toLowerCase().replace(notLetter, "");
};

// in console try: onlyLetters("hello world!");

/*
 * counts all of the letters in the input text and stores the counts as
 * a d3 map object
 * https://github.com/d3/d3-collection/blob/master/README.md#map
 */
var countLetters = function(input) {
  var text = onlyLetters(input);
  var count = d3.map();

  /*
   * you can loop through strings as if they are arrays
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for
   */
  for (var i = 0; i < text.length; i++) {
    var letter = text[i];

    // check if we have seen this letter before
    if (count.has(letter)) {
      count.set(letter, count.get(letter) + 1);
    }
    else {
      count.set(letter, 1);
    }
  }

  return count;
};

// in console try: countLetters("hello world!");
// in console try: countLetters("hello world!").keys();
// in console try: countLetters("hello world!").entries();