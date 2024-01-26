#!/bin/bash

# Initial year and month
year=2017
month=1

# Directory containing the PDF files
directory="statements"

# Generate a sorted list of filenames
readarray -t sorted_files < <(find "$directory" -name 'Statement (*.pdf' -print | sort -V)

echo "Files found:"
printf '%s\n' "${sorted_files[@]}"

# Loop through the files in the specified directory
for file in "${sorted_files[@]}"; do
    # echo $file;
    # Check if the file exists
    if [ -e "$file" ]; then
        # Format the month with leading zero
        formatted_month=$(printf "%02d" $month)

        # Construct the new file name
        new_name="statement_$year-$formatted_month.pdf"

        # Perform the file renaming
        mv "$file" "$directory/$new_name"

        # Print the action for confirmation
        echo "Renamed '$file' to '$directory/$new_name'"

        # Increment the month, and if it's 13, reset to 1 and increment the year
        month=$((month + 1))
        if [ $month -eq 13 ]; then
            month=1
            year=$((year + 1))
        fi
    fi
done
