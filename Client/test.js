let summation = [];

function addition(arr1, arr2) {
  if (arr1.length() > arr2.length) {
    for (let i = arr1.length, j = 0; i > 0, j < arr1.length; i--, j++) {
      let sum = arr1[i] + arr2[i];
      if (sum > 9) {
        while (carry > 9) {
          let num = 10;
          let carry = sum % num;
          carry = carry / 10;
        }
      }
      summation.push(sum);
    }
  } else if (arr2.length > arr1.length) {
    for (let i = arr2.length, j = 0; i > 0, j < arr2.length; i--, j++) {
      let sum = arr1[i] + arr2[i];
      summation.push(sum);
      [];
    }
  }
}
