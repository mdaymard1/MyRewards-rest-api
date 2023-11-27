import { Request, Response } from 'express';
import { getBusinessIdFromAuthToken } from '../src/services/BusinessService';
import {
  createSpecial,
  deleteExistingSpecial,
  getAllSpecials,
  updateExistingSpecial,
} from '../src/services/SpecialService';
import { Special } from '../src/entity/Special';

export const getSpecials = async (request: Request, response: Response) => {
  const businessId = getBusinessIdFromAuthToken(request);

  if (!businessId) {
    response.status(401);
    response.end();
    return;
  }

  getAllSpecials(businessId, function (specials: Special[]) {
    response.send(specials);
    return;
  });
};

export const createNewSpecial = async (
  request: Request,
  response: Response,
) => {
  const businessId = getBusinessIdFromAuthToken(request);

  if (!businessId) {
    response.status(401);
    response.end();
    return;
  }

  const { special } = request.body;

  if (!special) {
    console.log('Special object not found');
    response.status(400);
    response.end();
    return;
  }

  if (!special.title) {
    console.log('Special missing title');
    response.status(400);
    response.end();
    return;
  }

  if (!special.items) {
    console.log('Special missing items');
    response.status(400);
    response.end();
    return;
  }

  createSpecial(businessId, special, function (newSpecialId: string) {
    if (newSpecialId) {
      var specialResponse = Object();
      specialResponse.id = newSpecialId;
      response.send(specialResponse);
    } else {
      console.log('create special did not return a new id');
      response.status(400);
      response.end();
    }
  });
};

export const updateSpecial = async (request: Request, response: Response) => {
  const businessId = getBusinessIdFromAuthToken(request);

  if (!businessId) {
    response.status(401);
    response.end();
    return;
  }

  const { specialId } = request.params;
  const { special } = request.body;

  if (!special) {
    console.log('Special object not found');
    response.status(400);
    response.end();
    return;
  }

  if (!special.title) {
    console.log('Special missing title');
    response.status(400);
    response.end();
    return;
  }

  if (!special.items) {
    console.log('Special missing items');
    response.status(400);
    response.end();
    return;
  }

  updateExistingSpecial(specialId, special, function (wasSuccessful: boolean) {
    response.sendStatus(wasSuccessful ? 204 : 400);
  });
};

export const deleteSpecial = async (request: Request, response: Response) => {
  const businessId = getBusinessIdFromAuthToken(request);

  if (!businessId) {
    response.status(401);
    response.end();
    return;
  }

  const { specialId } = request.params;

  deleteExistingSpecial(specialId, function (wasSuccessful: boolean) {
    response.sendStatus(wasSuccessful ? 200 : 400);
  });
};

module.exports = {
  deleteSpecial,
  getSpecials,
  createNewSpecial,
  updateSpecial,
};
