import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { ITokenService } from '../auth/interfaces/ITokenService.js';

export class SocketServer {
  private _io: Server;

  private static _instance: Server;

  constructor(
    private readonly _httpServer: HttpServer,
    private readonly _prisma: PrismaClient,
    private readonly _tokenService: ITokenService
  ) {
    this._io = new Server(this._httpServer, {
      cors: {
        origin: '*', // For React Native / Expo MVP
        methods: ['GET', 'POST']
      }
    });

    SocketServer._instance = this._io;
    this.initialize();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static emitToUser(userId: string, event: string, data: any) {
    if (this._instance) {
      this._instance.to(`user__${userId}`).emit(event, data);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static emitToTrip(tripId: string, event: string, data: any) {
    if (this._instance) {
      this._instance.to(`trip__${tripId}`).emit(event, data);
    }
  }

  private initialize() {
    // Middleware for authentication
    this._io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error: Token missing'));
        }

        const decoded = await this._tokenService.verifyAccessToken(token);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socket as any).user = decoded;
        next();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        next(new Error('Authentication error: Invalid token'));
      }
    });

    this._io.on('connection', (socket: Socket) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = (socket as any).user;
      // eslint-disable-next-line no-console
      console.log(`Socket connected: ${socket.id}, User: ${user.userId}`);
      socket.join(`user__${user.userId}`);

      socket.on('join_trip', async (data: { tripId: string }) => {
        const { tripId } = data;
        
        // Basic authorization check
        const trip = await this._prisma.trip.findUnique({ where: { id: tripId }, include: { customer: true, driver: true } });
        if (!trip) {
          socket.emit('error', { message: 'Trip not found' });
          return;
        }

        const isParticipant = 
          user.role === 'ADMIN' || 
          trip.customer.userId === user.userId || 
          trip.driver.userId === user.userId;

        if (!isParticipant) {
          socket.emit('error', { message: 'Unauthorized to join this trip room' });
          return;
        }

        socket.join(`trip__${tripId}`);
        // eslint-disable-next-line no-console
        console.log(`User ${user.userId} joined trip room trip__${tripId}`);
      });

      socket.on('driver_location_update', async (data: { tripId: string, lat: number, lng: number }) => {
        const { tripId, lat, lng } = data;
        if (user.role !== 'DRIVER') {
          socket.emit('error', { message: 'Only drivers can broadcast location' });
          return;
        }

        const trip = await this._prisma.trip.findUnique({ where: { id: tripId }, include: { driver: true } });
        if (!trip || trip.driver.userId !== user.userId) {
          socket.emit('error', { message: 'Unauthorized for this trip' });
          return;
        }

        // Broadcast to all others in the room
        socket.to(`trip__${tripId}`).emit('driver_location_updated', {
          tripId,
          lat,
          lng,
          timestamp: new Date().toISOString()
        });

        // Save latest location to driver profile asynchronously
        this._prisma.driverProfile.update({
          where: { userId: user.userId },
          data: { currentLatitude: lat, currentLongitude: lng, lastLocationAt: new Date() }
        }).catch(err => console.error('Failed to update driver location in DB', err));
      });

      socket.on('disconnect', () => {
        // eslint-disable-next-line no-console
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });
  }
}

