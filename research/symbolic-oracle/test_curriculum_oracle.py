"""Regression checks for the independent, generated-input-only oracle."""

import unittest

import sympy as sp
from curriculum_oracle import expression, matches, x


class CurriculumOracleTests(unittest.TestCase):
    def test_precedence_and_grouping(self):
        self.assertEqual(expression("3+4*2"), 11)
        self.assertEqual(expression("(3+4)*2"), 14)

    def test_implicit_products_and_exact_signed_fractions(self):
        self.assertEqual(expression("3(x+2)-2x"), x + 6)
        self.assertEqual(expression("(-3)/2"), sp.Rational(-3, 2))

    def test_rejects_unrecognized_nodes(self):
        for value in ["f(x)", "x.real", "x**2", "[1, 2]", "y+1"]:
            with self.subTest(value=value), self.assertRaises(ValueError):
                expression(value)

    def test_equation_goal_requires_a_unique_equation_solution(self):
        self.assertTrue(matches("2x=4", 2, True))
        self.assertFalse(matches("2", 2, True))
        self.assertFalse(matches("0=0", 2, True))
        self.assertFalse(matches("2x=4", 3, True))

    def test_expression_goal_checks_symbolic_equivalence(self):
        self.assertTrue(matches("3x+2x", 5 * x, False))
        self.assertFalse(matches("5x+1", 5 * x, False))
        self.assertTrue(matches("1/2=2/4", sp.Rational(1, 2), False))
        self.assertFalse(matches("1/2=2/5", sp.Rational(1, 2), False))
