import { Request, Response, NextFunction } from 'express';
import { IAuthService } from '../interfaces/IAuthService.js';
import { RegisterCustomerDTO } from '../dtos/RegisterCustomerDTO.js';
import { RegisterDriverDTO } from '../dtos/RegisterDriverDTO.js';
import { LoginDTO } from '../dtos/LoginDTO.js';
import { RefreshTokenDTO } from '../dtos/RefreshTokenDTO.js';
import { ApiResponseBuilder } from '../../../common/utils/ApiResponse.js';
import { HttpStatusCodes } from '../../../common/constants/HttpStatusCodes.js';
import { ResponseMessages } from '../../../common/constants/ResponseMessages.js';
import { UnauthorizedError } from '../../../common/errors/HttpErrors.js';

export class AuthController {
  private readonly _authService: IAuthService;

  constructor(authService: IAuthService) {
    this._authService = authService;
  }

  public registerCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto = req.body as RegisterCustomerDTO;
      const result = await this._authService.registerCustomer(dto);

      res
        .status(HttpStatusCodes.CREATED)
        .json(
          ApiResponseBuilder.success(
            result,
            ResponseMessages.USER_REGISTERED_SUCCESSFULLY
          )
        );
    } catch (error) {
      next(error);
    }
  };

  public registerDriver = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto = req.body as RegisterDriverDTO;
      const result = await this._authService.registerDriver(dto);

      res
        .status(HttpStatusCodes.CREATED)
        .json(
          ApiResponseBuilder.success(
            result,
            ResponseMessages.USER_REGISTERED_SUCCESSFULLY
          )
        );
    } catch (error) {
      next(error);
    }
  };

  public login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto = req.body as LoginDTO;
      const result = await this._authService.login(dto);

      res
        .status(HttpStatusCodes.OK)
        .json(ApiResponseBuilder.success(result, ResponseMessages.LOGIN_SUCCESSFUL));
    } catch (error) {
      next(error);
    }
  };

  public refresh = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto = req.body as RefreshTokenDTO;
      const tokens = await this._authService.refreshToken(dto);

      res
        .status(HttpStatusCodes.OK)
        .json(
          ApiResponseBuilder.success(
            tokens,
            ResponseMessages.TOKEN_REFRESHED_SUCCESSFULLY
          )
        );
    } catch (error) {
      next(error);
    }
  };

  public logout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto = req.body as RefreshTokenDTO;
      await this._authService.logout(dto.refreshToken);

      res
        .status(HttpStatusCodes.OK)
        .json(ApiResponseBuilder.success(null, ResponseMessages.LOGOUT_SUCCESSFUL));
    } catch (error) {
      next(error);
    }
  };

  public me = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const user = await this._authService.getCurrentUser(req.user.userId);

      res
        .status(HttpStatusCodes.OK)
        .json(
          ApiResponseBuilder.success(
            user,
            ResponseMessages.PROFILE_RETRIEVED_SUCCESSFULLY
          )
        );
    } catch (error) {
      next(error);
    }
  };
}
