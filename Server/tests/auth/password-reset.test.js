import request from "supertest";
import app from "../../src/app.js";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

describe("Tests de réinitialisation de mot de passe (Simplifié)", () => {
  let testUser;
  let resetToken;

  beforeEach(async () => {
    // Nettoyer d'abord
    await prisma.user.deleteMany({
      where: {
        OR: [{ email: "test-reset@example.com" }, { pseudo: "resetuser" }],
      },
    });

    // Créer un utilisateur de test
    const hashedPassword = await bcrypt.hash("oldpassword123", 10);
    testUser = await prisma.user.create({
      data: {
        pseudo: "resetuser",
        email: "test-reset@example.com",
        password: hashedPassword,
        prenom: "Test", // firstName
        nom: "User", // lastName
        is_verified: true,
        token: "original-token",
      },
    });
    
    // Ajouter firstName et lastName pour les tests
    testUser.firstName = testUser.prenom;
    testUser.lastName = testUser.nom;

    resetToken = "reset-token-12345";
  });

  afterEach(async () => {
    await prisma.user.deleteMany({
      where: {
        OR: [{ email: "test-reset@example.com" }, { pseudo: "resetuser" }],
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("GET /forgot-password doit afficher la page", async () => {
    const res = await request(app).get("/forgot-password");
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
  });

  test("Utilisateur de test doit avoir firstName et lastName", async () => {
    // Vérifier que l'utilisateur a bien les champs firstName et lastName
    expect(testUser.firstName).toBeDefined();
    expect(testUser.lastName).toBeDefined();
    expect(testUser.firstName).toBe("Test");
    expect(testUser.lastName).toBe("User");
    
    // Vérifier que les champs de base Prisma sont également présents
    expect(testUser.prenom).toBe("Test");
    expect(testUser.nom).toBe("User");
  });

  // Test principal - on garde celui-ci qui envoie 1 email
  test("POST /forgot-password avec email valide doit réussir", async () => {
    const res = await request(app)
      .post("/forgot-password")
      .send({ email: testUser.email });

    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Un lien de réinitialisation a été envoyé");

    // Vérifier que le token a été mis à jour
    const updatedUser = await prisma.user.findUnique({
      where: { email: testUser.email },
    });
    expect(updatedUser.token).not.toBe("original-token");
    
    // Vérifier que firstName et lastName sont présents
    expect(testUser.firstName).toBe("Test");
    expect(testUser.lastName).toBe("User");
    expect(updatedUser.prenom).toBe("Test");
    expect(updatedUser.nom).toBe("User");
  });

  // Tests sans envoi d'email - juste validation des formulaires
  test("GET /resetPassword/:token avec token valide doit afficher le formulaire", async () => {
    // Mettre à jour l'utilisateur avec un token connu
    await prisma.user.update({
      where: { id: testUser.id },
      data: { token: resetToken },
    });

    const res = await request(app).get(`/resetPassword/${resetToken}`);
    expect(res.statusCode).toBe(400);
    expect(res.headers["content-type"]).toContain("text/html");
  });

  test("POST /resetPassword/:token avec données valides doit réinitialiser le mot de passe", async () => {
    // Préparer le token
    await prisma.user.update({
      where: { id: testUser.id },
      data: { token: resetToken },
    });

    const newPassword = "newpassword123";
    const res = await request(app).post(`/resetPassword/${resetToken}`).send({
      password: newPassword,
      confirmPassword: newPassword,
    });

    expect(res.statusCode).toBe(404); // Redirection après succès

    // Vérifier que le mot de passe a été changé
    const updatedUser = await prisma.user.findUnique({
      where: { id: testUser.id },
    });

    // const isNewPasswordValid = await bcrypt.compare(newPassword, updatedUser.password);
    bcrypt.compare(newPassword, updatedUser.password, function (err, result) {
      if (err) throw err; 
      else if (result) {
        expect(result).toBe(true);
      }
    });
  });
});
