type WikipediaApiResult<T = unknown> = {
  query: {
    pages: {
      [key: number]: T;
    };
  };
};

type WikimediaImageInfoExt = {
  imageinfo: {
    [key: number]: {
      extmetadata: {
        Artist: {
          value: string;
        };
        LicenseShortName: {
          value: string;
        };
      };
    };
  };
};

type WikimediaImageResult = {
  results: {
    bindings: {
      o: {
        value: string;
      };
    }[];
  };
};

export type WikimediaImage = {
  artist: string;
  license: string;
  fileName: string;
  url: string;
};

/**
 * Queries the Wikipedia API
 * @param url
 */
async function queryWikipediaApi<T = unknown>(
  url: string,
): Promise<T | undefined> {
  console.debug(`Querying wikipedia API...`);
  const response = await fetch(url);

  if (!response.ok) {
    console.debug(`Querying wikipedia API failed`, response);
    return undefined;
  }

  const result = (await response.json()) as WikipediaApiResult<T>;
  const data = Object.values(result?.query?.pages || {}).shift();

  console.debug(`Querying wikipedia API succeeded:`, data);
  return data;
}

/**
 * Get an image url from Wikidata
 * @param wikidataId
 */
export async function getWikidataImage(wikidataId: string) {
  console.debug(`Fetching wikidata image...`);
  const query = encodeURIComponent(
    `SELECT ?o WHERE { wd:${wikidataId} wdt:P18 ?o. }`,
  );
  const wikidataUrl = `https://query.wikidata.org/sparql?query=${query}&format=json`;

  const response = await fetch(wikidataUrl, {
    headers: {
      "User-Agent":
        "A11yScoreBot/1.0 (https://a11yscore.org; developers@sozialhelden.de) generic-library/1.0",
    },
  });

  if (!response.ok) {
    console.debug(`Fetching wikidata image failed`, response);
    return undefined;
  }

  const data = (await response.json()) as WikimediaImageResult;
  console.debug(`Fetching wikidata succeeded:`, data);

  return data?.results?.bindings[0]?.o?.value;
}

/**
 * Get a image from wikipedia/wikimedia for a given wikidataId
 * @param wikidataId
 */
export async function getImage(
  wikidataId: string,
): Promise<WikimediaImage | undefined> {
  // get image url from wikidata
  const url = await getWikidataImage(wikidataId);
  if (!url) return undefined;

  const fileName = url.split("FilePath/").pop();
  if (!fileName) return undefined;

  // get image metadata from the wikipedia api
  const imageInfoResult = await queryWikipediaApi<WikimediaImageInfoExt>(
    `https://en.wikipedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata&titles=File:${fileName}&format=json`,
  );
  const firstImageInfo = Object.values(imageInfoResult?.imageinfo || {})[0];

  const { Artist: artistInfo, LicenseShortName: licenseInfo } =
    firstImageInfo?.extmetadata || {};

  const artist = artistInfo?.value;
  const license = licenseInfo?.value;

  return {
    artist,
    license,
    fileName,
    url,
  };
}
