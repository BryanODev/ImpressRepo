
import { getStore } from "@netlify/blobs";

const reply = (data, status = 200) =>
  Response.json(data, { status });

export default async (request) => {
  if (request.method !== "POST") {
    return reply({ error: "Method not allowed" }, 405);
  }

  const secret = process.env.ACTION_SECRET;
  const key = process.env.TRELLO_API_KEY;
  const token = process.env.TRELLO_API_TOKEN;

  if (!secret || !key || !token) {
    return reply({ error: "Server not configured" }, 500);
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return reply({ error: "Unauthorized" }, 401);
  }

  const trello = async (path, method = "GET", body = null) => {
    const response = await fetch(`https://api.trello.com/1${path}`, {
      method,
      headers: {
        Authorization: `OAuth oauth_consumer_key="${key}", oauth_token="${token}"`,
        ...(body ? { "Content-Type": "application/json" } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });

    if (!response.ok) {
      throw new Error(`Trello API error: ${response.status}`);
    }

    return response.json();
  };

  let input;

  try {
    input = await request.json();
  } catch {
    return reply({ error: "Invalid JSON" }, 400);
  }

  const {
    business,
    board,
    list,
    description = "",
    items = []
  } = input ?? {};

  if (
    ![business, board, list].every(
      value => typeof value === "string" && value.trim()
    ) ||
    typeof description !== "string" ||
    !Array.isArray(items)
  ) {
    return reply({ error: "Invalid job details" }, 400);
  }

  const normalize = value => value.trim().toLowerCase();

  try {
    // Find requested board.
    const boards = await trello(
      "/members/me/boards?filter=open&fields=name,url"
    );

    const boardMatches = boards.filter(
      entry => normalize(entry.name) === normalize(board)
    );

    if (boardMatches.length !== 1) {
      return reply({
        error: boardMatches.length === 0
          ? "Board not found"
          : "Multiple boards have this name",
        availableBoards: boards.map(b => ({
          id: b.id,
          name: b.name
        }))
      }, 400);
    }

    const selectedBoard = boardMatches[0];

    // Find requested list within that board.
    const lists = await trello(
      `/boards/${selectedBoard.id}/lists?filter=open&fields=name`
    );

    const listMatches = lists.filter(
      entry => normalize(entry.name) === normalize(list)
    );

    if (listMatches.length !== 1) {
      return reply({
        error: listMatches.length === 0
          ? "List not found"
          : "Multiple lists have this name",
        availableLists: lists.map(l => ({
          id: l.id,
          name: l.name
        }))
      }, 400);
    }

    const selectedList = listMatches[0];

    // Create card in the selected list.
    const card = await trello("/cards", "POST", {
      idList: selectedList.id,
      name: business.trim(),
      desc: description
    });

    // Save associated items.
    try {
      const store = getStore("trello-card-items");
      await store.setJSON(card.id, items);
    } catch {
      return reply({
        error: "Card created, but saving items failed",
        cardId: card.id,
        url: card.url
      }, 500);
    }

    return reply({
      success: true,
      board: selectedBoard.name,
      list: selectedList.name,
      cardId: card.id,
      url: card.url,
      itemsSaved: true
    });

  } catch (error) {
    console.error(error.message);
    return reply({ error: "Job creation failed" }, 502);
  }
};
