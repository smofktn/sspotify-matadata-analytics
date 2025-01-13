import { SearchType } from "./types/SearchType";
import SpotifyWebApi from "spotify-web-api-node";
import "dotenv/config";
import { searchWithQuery } from "./repository/searchWithQuery";
import { SearchOptions } from "./types/SerchOptions";
import {
  generateRandomValueWithMax,
  generateRandomValueWithMinAndMax,
} from "./common/generateRandomValue";
import yargs from "yargs";
import { isSearchType } from "./common/isSearchType";
import { convertSearchQueryToString } from "./common/convertSearchQueryToString";
import { SearchQueryFieldType } from "./types/SearchQueryFieldType";
import { genres } from "./constants/genres";
import { getTimestampedFileName } from "./common/getTimestampedFileName";
import { writeResponseToJsonFile } from "./common/writeResponseToJsonFile";
import { Parser } from "json2csv";
import fs from "fs";

// Spotify APIクライアントの初期化
export const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

const minYear = 1930;
const maxYear = 2025;

const argv = yargs
  .options({
    keyword: {
      type: "string",
      describe: "キーワード",
      demandOption: false,
    },
    genre: {
      type: "string",
      describe: "ジャンル名",
      demandOption: false,
      default: genres[generateRandomValueWithMax(genres.length)],
    },
    year: {
      type: "string",
      describe: "年代",
      demandOption: false,
      default: generateRandomValueWithMinAndMax(minYear, maxYear).toString(),
    },
    limit: {
      type: "number",
      describe: "取得したいアイテム数",
      demandOption: false,
      default: 10,
    },
    type: {
      type: "string",
      describe:
        "取得したいアイテムタイプ（album、artist、playlist、track、show、episode）",
      demandOption: true,
      default: "track",
    },
  })
  .parseSync();

const limit = argv.limit;
const maxOffset = 1000;

let type: SearchType[] = [];
if (isSearchType(argv.type)) {
  type = [argv.type];
} else {
  console.error("不正なtypeが指定されました。\n", argv.type);
  process.exit(1);
}

const option: SearchOptions = {
  limit: limit,
  offset: generateRandomValueWithMax(maxOffset),
  market: "JP",
};

const param: SearchQueryFieldType = {
  keyword: argv.keyword,
  genre: argv.genre,
  year: argv.year,
};

const query = convertSearchQueryToString(param);
console.info("query:", query);

searchWithQuery(query, type, option)
  .then((resBody) => {
    console.log("レスポンス\n", JSON.stringify(resBody));
    const fileName = getTimestampedFileName();
    const filePath = `res/${fileName}.json`;
    writeResponseToJsonFile(filePath, resBody);
    const parser = new Parser();
    const csvData = parser.parse(resBody);
  })
  .catch((error) => {
    console.error("Error:", error);
  });

const convertJsonToCsv = (jsonString: string) => {
  const jsonData = JSON.parse(jsonString);
  const parser = new Parser({
    delimiter: ",", // カンマ区切り
    header: true, // ヘッダーを含める
    quote: '"', // ダブルクォートで囲む
    eol: "\r\n", // 改行コードを Windows (Excelに適した形式)
    transforms: [
      (record) => {
        // ネストごとに改行を入れる処理
        return Object.keys(record)
          .map((key) => `${key}: ${record[key]}`)
          .join("\r\n");
      },
    ],
  });
  const csv = parser.parse(jsonData);
  const fileName = getTimestampedFileName();
  const filePath = `res/${fileName}.csv`;
  fs.writeFile(filePath, csv, "utf-8", (err) => {
    if (err) {
      console.error("エラーが発生しました:", err);
      return;
    }
    console.log("ファイルに書き込みが完了しました");
  });
};
