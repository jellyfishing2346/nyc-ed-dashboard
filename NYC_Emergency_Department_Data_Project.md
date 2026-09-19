# NYC Emergency Department Data Project

## What I Want to Build

I want to build a data visualization project using the NYC Open Data dataset on Emergency Department Visits and Admissions for Influenza-like Illness and/or Pneumonia.

Dataset:
https://data.cityofnewyork.us/Health/Emergency-Department-Visits-and-Admissions-for-Inf/2nwg-uqyg/about_data

The goal is to take the information in this dataset and make it easier for someone to explore and understand. I don't want the project to just display a large table of data. I want the user to be able to see patterns and changes in the data visually.

## What I'm Thinking

I'm imagining a simple dashboard where the data is the main focus.

One of the main things I want to show is how emergency department visits change over time. I also want users to be able to compare different parts of the dataset and use filters to explore the data themselves.

I don't want to add charts or features just to make the dashboard look more complicated. Each visualization should help answer an actual question about the data.

## Before We Start Coding

First, look at the dataset and understand what we're actually working with.

Look at:

- What each column represents
- What time period the data covers
- What categories we can compare
- What measurements are available
- Whether there are missing or unusual values
- What useful questions we can answer with the data

Based on that, suggest which visualizations would make the most sense.

Don't start building the entire project immediately. I want to understand the data first and then decide what the dashboard should include.

## Building the Project

Once we understand the data, we'll build the project piece by piece.

Start with the basic page and the most useful visualization, which will probably be the trend over time.

If possible, use the NYC Open Data API so the application can get the data directly instead of hardcoding the dataset into the project.

After the first visualization is working, we can add filters and other useful charts based on what we learned from the dataset.

When filters are added, the charts should work together. For example, if the user changes a filter, the relevant visualizations should update to reflect that selection.

## Design

Keep the design simple, clean, and easy to understand.

The visualizations should be the main focus of the page. I don't want a lot of unnecessary UI elements distracting from the data.

Someone who has never seen the original dataset should still be able to understand what the dashboard is showing.

Charts should have clear titles, labels, and explanations where they are needed.

## While You're Working

Before making a major change, look at what is already there and try to work with it instead of replacing working code.

Don't change unrelated parts of the project unless there's a reason to.

If you think something should be designed or implemented differently from what I asked for, explain your reasoning first.

Build things gradually so we can make sure each part works before moving on to the next one.

## Testing

As we build the project, check that:

- The data loads correctly
- The visualizations match the data
- Filters work correctly
- The page handles missing or empty data
- Loading and error states make sense
- The dashboard works at different screen sizes
- The charts are understandable without needing to look at the original dataset

If something isn't working, figure out why instead of working around the problem with hardcoded data.

## Overall Goal

I want the finished project to tell a story with the NYC emergency department data.

A user should be able to open the dashboard, understand what they're looking at, explore the data, and come away knowing something that wasn't obvious from looking at the raw dataset.
