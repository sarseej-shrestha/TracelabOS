import unittest
from geometry_oracle import quantity, length
import sympy as sp


class GeometryOracleTests(unittest.TestCase):
    def test_area_and_length_are_different(self):
        self.assertNotEqual(quantity("24cm"), quantity("24cm²"))

    def test_metric_scale_is_exact(self):
        self.assertEqual(quantity("24cm²"), quantity("2400mm²"))
        self.assertEqual(quantity("24cm²"), quantity("0.0024m^2"))

    def test_perpendicular_product_and_inverse(self):
        self.assertEqual(quantity("8cm*3cm"), sp.Rational(24, 10000) * length**2)
        self.assertEqual(quantity("24cm²/(8cm)"), sp.Rational(3, 100) * length)

    def test_fractional_lengths(self):
        self.assertEqual(quantity("5cm*(3/2)cm"), sp.Rational(15, 20000) * length**2)

    def test_rejects_non_generated_nodes(self):
        for text in ["__import__('os')", "x", "cm.real", "2**10", "True", "1/0"]:
            with self.assertRaises(ValueError):
                quantity(text)


if __name__ == "__main__":
    unittest.main()
