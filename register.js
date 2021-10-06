import bcrypt from 'bcryptjs';
import { createAccessToken, createRefreshToken } from '../../../assets/Utils/GenerateToken';
import { usersCollection } from '../../../assets/Utils/ConnectDB';

export default async (req, res) => {
  switch (req.method) {
    case 'POST':
      await register(req, res);
      break;

    default:
  }
};

const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    const users = await usersCollection();
    const user = await users.findOne(
      { email },
      {
        projection: {
          password: 0,
          ceiPassword: 0,
        },
      },
    );
    if (user) return res.status(405).json({ emailMessage: 'Email já cadastrado' });

    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = await users.insertOne(
      {
        name: null,
        email,
        password: passwordHash,
        role: 'user',
        admin: false,
        avatarImage: '',
        cpf: '',
        lastSyncWithCei: null,
        lastTaxCalculation: null,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        wrongPassword: false,
        wrongCpf: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    );

    const accessToken = createAccessToken({ id: newUser.ops[0]._id });
    const refreshToken = createRefreshToken({ id: newUser.ops[0]._id });

    res.json({
      msg: 'Register Success',
      refreshToken,
      accessToken,
    });
  } catch (err) {
    return res.status(500).json({ err: err.message, status: 500 });
  }
};
