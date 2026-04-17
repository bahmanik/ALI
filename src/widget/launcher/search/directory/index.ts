import directorySearch from "./search";

export interface DirectoryResult {
  path: string;
  name: string;
  isDirectory: boolean;
  score: number; // Fuzzy match score
}

export interface DirectoryButtonResult {
  result: DirectoryResult;
  index: number;
}

export default async function getDirectoryResults(searchText: string): Promise<DirectoryButtonResult[]> {
  if (!searchText || searchText.length < 1) {
    return [];
  }

  // TEMPORARY: Always return test data to verify UI works
  console.info("Directory search called", { searchText });

  if (searchText === "ui-test") {
    return [
      {
        result: {
          path: "/home/test/Documents/file1.txt",
          name: "file1.txt",
          isDirectory: false,
          score: 100,
        },
        index: 0,
      },
      {
        result: {
          path: "/home/test/Documents",
          name: "Documents",
          isDirectory: true,
          score: 90,
        },
        index: 1,
      },
    ];
  }

  try {
    const results = await directorySearch.search(searchText, {
      maxResults: 20,       // More results
      searchHidden: false,  // Don't search hidden files by default
      maxDepth: 4,          // Reasonable depth for fd
    });

    const buttonResults: DirectoryButtonResult[] = results.map((result, index) => ({
      result: {
        path: result.path,
        name: result.name,
        isDirectory: result.isDirectory,
        score: result.score || 0,
      },
      index,
    }));

    console.debug("Directory search results", {
      query: searchText,
      resultCount: buttonResults.length
    });

    return buttonResults;
  } catch (error) {
    console.error("Failed to get directory results", { error });
    return [];
  }
}
