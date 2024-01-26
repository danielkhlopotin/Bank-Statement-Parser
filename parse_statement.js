const PDFExtract = require("pdf.js-extract").PDFExtract;
const fs = require("fs");
const path = require("path");

/*
 * Take in a pdf and convert it to to a string that we can work with
 * Note that newlines will be stripped from the final string.
 */
async function getStringFromPdfBuffer(fileBuffer) {
  let string = "";
  const pdfExtract = new PDFExtract();
  const options = {};
  try {
    let response = await pdfExtract.extractBuffer(fileBuffer, options);
    response.pages.forEach((page) => {
      page.content.forEach((content) => {
        if (content.str == "") {
          string += " ";
        }
        string += content.str;
      });
    });
    return Promise.resolve(string);
  } catch (err) {
    return Promise.reject(`Error: ${err}`);
  }
}

async function readFileAsBuffer(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, buffer) => {
      if (err) {
        console.error("Error reading file:", err);
        reject(`Error: ${err}`);
      }

      resolve(buffer);
    });
  });
}

async function getFileList(directory) {
  try {
    // Directory path
    const directoryPath = path.join(__dirname, directory);

    // Read directory and wait for the files array
    const files = await fs.promises.readdir(directoryPath);

    // Map the files array to include the directory in each file path
    const fileList = files.map((file) => path.join(directory, file));

    // Return the fileList array
    return fileList;
  } catch (err) {
    console.log("Unable to scan directory: " + err);
    throw err; // Rethrow the error for the caller to handle
  }
}

function extractBalances(string, includeEndingBalance, separator) {
  const regex = /Balance on (\w+ \d{1,2}, \d{4}) \$([\d,]+\.\d+)/g;
  let match;
  const results = [];

  while ((match = regex.exec(string)) !== null) {
    // Extracted date and amount
    const date = match[1];
    const amount = match[2];

    // Add to results
    results.push(`${date}${separator} $${amount}`);
  }
  return includeEndingBalance ? results : [results[0]];
}

async function getCsvRows(filePath, includeEndingBalance) {
  let buffer = await readFileAsBuffer(filePath);
  let string = await getStringFromPdfBuffer(buffer);
  const separator = "|";
  return extractBalances(string, includeEndingBalance, separator);
}

function appendToCSV(filePath, dataString) {
  // Ensure the data ends with a newline character
  const row = dataString.endsWith("\n") ? dataString : dataString + "\n";

  // Append the data to the CSV file
  fs.appendFile(filePath, row, (err) => {
    if (err) {
      console.error("Error appending to CSV:", err);
      return;
    }
  });
}

function appendItemsToCSV(csvFilePath, array) {
  array.forEach((balance) => {
    appendToCSV(csvFilePath, balance);
  });
}

async function main() {
  // The directory containing your bank statments
  const directory = "statements/";
  // the csv file you want to write to
  const csvFilePath = path.join(
    __dirname,
    "statement_balances_pipe_separator.csv"
  );

  let fileList = await getFileList(directory);
  const lastFileIndex = fileList.length - 1;
  for (let fileIndex = 0; fileIndex < lastFileIndex; fileIndex++) {
    appendItemsToCSV(csvFilePath, await getCsvRows(fileList[fileIndex], false));
  }
  appendItemsToCSV(
    csvFilePath,
    await getCsvRows(fileList[lastFileIndex], true)
  );
}

main();
