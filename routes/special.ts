import { Request, Response } from "express";
import { getBusinessIdFromAuthToken } from "../src/services/BusinessService";
import {
  createSpecial,
  deleteExistingSpecial,
  getAllSpecials,
  getSpecialById,
  updateExistingSpecial,
} from "../src/services/SpecialService";
import { Special } from "../src/entity/Special";

export const getSpecial = async (request: Request, response: Response) => {
  const businessId = await getBusinessIdFromAuthToken(request);

  if (!businessId) {
    response.status(401);
    response.end();
    return;
  }
  const { specialId } = request.params;

  if (!specialId) {
    response.status(404);
    response.end();
    return;
  }
  const special = await getSpecialById(specialId);
  response.send(special);
  return;
};

export const getSpecials = async (request: Request, response: Response) => {
  const businessId = await getBusinessIdFromAuthToken(request);

  if (!businessId) {
    response.status(401);
    response.end();
    return;
  }

  const specials = await getAllSpecials(businessId);
  response.send(specials);
  return;
};

export const createNewSpecial = async (
  request: Request,
  response: Response
) => {
  const businessId = await getBusinessIdFromAuthToken(request);

  if (!businessId) {
    response.status(401);
    response.end();
    return;
  }

  const { special } = request.body;

  if (!special) {
    console.log("Special object not found");
    response.status(400);
    response.end();
    return;
  }

  if (!special.title) {
    console.log("Special missing title");
    response.status(400);
    response.end();
    return;
  }

  if (!special.items) {
    console.log("Special missing items");
    response.status(400);
    response.end();
    return;
  }

  const newSpecialId = await createSpecial(businessId, special);
  if (newSpecialId) {
    var specialResponse = Object();
    specialResponse.id = newSpecialId;
    response.send(specialResponse);
  } else {
    console.log("create special did not return a new id");
    response.status(400);
    response.end();
  }
};

export const updateSpecial = async (request: Request, response: Response) => {
  const businessId = await getBusinessIdFromAuthToken(request);

  if (!businessId) {
    response.status(401);
    response.end();
    return;
  }

  const { specialId } = request.params;
  const { special } = request.body;

  if (!special) {
    console.log("Special object not found");
    response.status(400);
    response.end();
    return;
  }

  if (!special.title) {
    console.log("Special missing title");
    response.status(400);
    response.end();
    return;
  }

  if (!special.items) {
    console.log("Special missing items");
    response.status(400);
    response.end();
    return;
  }
  const wasSuccessful = await updateExistingSpecial(specialId, special);
  response.send(wasSuccessful ? 204 : 400);
};

export const deleteSpecial = async (request: Request, response: Response) => {
  const businessId = await getBusinessIdFromAuthToken(request);

  if (!businessId) {
    response.status(401);
    response.end();
    return;
  }

  const { specialId } = request.params;

  const wasSuccessful = await deleteExistingSpecial(specialId);
  response.sendStatus(wasSuccessful ? 200 : 400);
};

module.exports = {
  deleteSpecial,
  getSpecial,
  getSpecials,
  createNewSpecial,
  updateSpecial,
};
